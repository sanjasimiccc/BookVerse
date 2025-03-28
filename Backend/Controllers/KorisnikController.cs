using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using DomainModel;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using Neo4jClient;
using Neo4jClient.Cypher;

namespace Controllers;

[ApiController]
[Route("[controller]")]
public class KorisnikController : ControllerBase
{
    private readonly IGraphClient _client;
    private readonly IUserService _userService;
    private readonly IConfiguration _configuration;


    private static readonly List<string> administratori = ["anastasija.simic", "darija.denic", "sanja.simic"];

    public KorisnikController(IGraphClient client, IUserService userService, IConfiguration configuration)
    {
        _client = client;
        _userService = userService;
        _configuration = configuration;
    }

    [HttpPost]
    [Route("dodajKorisnika")]
    public async Task<ActionResult> DodajKorisnika([FromBody] Korisnik korisnik) //ne treba nam ova fja
    {
        if (korisnik == null)
        {
            return BadRequest("Podaci o korisniku nisu validni.");
        }

        try
        {
            // Validacija ID-eva žanrova
            var prosledjeniZanrovi = korisnik.zanrovi;

            if (prosledjeniZanrovi != null && prosledjeniZanrovi.Any())
            {
                var postojeciZanrovi = await _client.Cypher
                    .Match("(z:Zanr)")
                    .Where("z.id IN $ids")
                    .WithParam("ids", prosledjeniZanrovi)
                    .Return(z => z.As<Zanr>().id)
                    .ResultsAsync;

                // Proveri da li svi prosleđeni ID-evi postoje
                var nepostojeciZanrovi = prosledjeniZanrovi.Except(postojeciZanrovi).ToList();

                if (nepostojeciZanrovi.Any())
                {
                    return BadRequest($"Ne postoje sledeći ID-evi žanrova: {string.Join(", ", nepostojeciZanrovi)}");
                }
            }

            var korisnikId = Guid.NewGuid().ToString();

            // Kreiranje korisnika u Neo4j
            await _client.Cypher
                .Create("(n:Korisnik {id: $id, ime: $ime, username: $username, sifra: $sifra, opis: $opis, zanrovi: $zanrovi, slika: $slika})")
                .WithParams(new
                {
                    id = korisnikId,
                    korisnik.ime,
                    korisnik.username,
                    korisnik.sifra,
                    korisnik.opis,
                    zanrovi = prosledjeniZanrovi,
                    korisnik.slika
                })
                .ExecuteWithoutResultsAsync();

            // Kreiranje veza "PREFERIRA"
            if (prosledjeniZanrovi != null && prosledjeniZanrovi.Any())
            {
                await _client.Cypher
                    .Match("(k:Korisnik)", "(z:Zanr)")
                    .Where("k.id = $korisnikId AND z.id IN $zanroviIds")
                    .WithParams(new
                    {
                        korisnikId,
                        zanroviIds = prosledjeniZanrovi
                    })
                    .Create("(k)-[:PREFERIRA]->(z)")
                    .ExecuteWithoutResultsAsync();
            }


            return Ok("Korisnik je uspešno dodat.");
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Došlo je do greške: re{ex.Message}");
        }
    }
    [HttpPut]
    [Route("azurirajKorisnika"), Authorize(Roles = "user")]
    public async Task<ActionResult> AzurirajKorisnika([FromBody] KorisnikDTO korisnik)
    {
        if (korisnik == null)
        {
            return BadRequest("Podaci o korisniku nisu validni.");
        }

        try
        {
            var usernameIzTokena = _userService.GetUser();
            if (usernameIzTokena == null)
            {
                return StatusCode(401, $"Došlo je do greške prilikom preuzimanja informacija iz tokena");
            }
            // Prvo proveravamo postojanje korisnika sa datim ID-jem
            var korisnikExists = await _client.Cypher
                .Match("(k:Korisnik)")
                .Where((Korisnik k) => k.username == usernameIzTokena)
                .Return<int>("count(k)")
                .ResultsAsync;

            if (korisnikExists.FirstOrDefault() == 0)
            {
                return NotFound($"Korisnik  nije pronađen.");
            }

            // Provera da li žanrovi postoje
            if (korisnik.zanrovi != null && korisnik.zanrovi.Any())
            {
                var postojeciZanrovi = await _client.Cypher
                    .Match("(z:Zanr)")
                    .Where("z.id IN $zanroviIds")
                    .WithParam("zanroviIds", korisnik.zanrovi)
                    .Return<string>("z.id")
                    .ResultsAsync;

                var nepostojeciZanrovi = korisnik.zanrovi.Except(postojeciZanrovi).ToList();

                if (nepostojeciZanrovi.Any())
                {
                    return BadRequest($"Ne postoje sledeći ID-evi žanrova: {string.Join(", ", nepostojeciZanrovi)}");
                }
            }

            // Kreiranje upita za ažuriranje korisnika
            var query = _client.Cypher.Match("(k:Korisnik)")
                .Where((Korisnik k) => k.username == usernameIzTokena);

            // Kreiranje parametara samo za ne-null vrednosti
            var parameters = new Dictionary<string, object>();

            // Dodajemo vrednosti samo ako su prosleđene (ako nisu null ili prazne)
            if (!string.IsNullOrEmpty(korisnik.ime))
            {
                query = query.Set("k.ime = $ime");
                parameters.Add("ime", korisnik.ime);
            }

            if (!string.IsNullOrEmpty(korisnik.username))
            {
                query = query.Set("k.username = $username");
                parameters.Add("username", korisnik.username);
            }

            if (!string.IsNullOrEmpty(korisnik.sifra))
            {
                string sifra = BCrypt.Net.BCrypt.HashPassword(korisnik.sifra);
                query = query.Set("k.sifra = $sifra");
                parameters.Add("sifra", sifra);
            }

            if (!string.IsNullOrEmpty(korisnik.opis))
            {
                query = query.Set("k.opis = $opis");
                parameters.Add("opis", korisnik.opis);
            }

            if (!string.IsNullOrEmpty(korisnik.slika))
            {
                query = query.Set("k.slika = $slika");
                parameters.Add("slika", korisnik.slika);
            }

            if (korisnik.zanrovi != null && korisnik.zanrovi.Any())
            {
                query = query.Set("k.zanrovi = $zanrovi"); // Ažuriraj listu žanrova na korisniku
                parameters.Add("zanrovi", korisnik.zanrovi);
            }

            //string sifra = BCrypt.Net.BCrypt.HashPassword(korisnik.sifra);
            // Dodajemo parametre u upit
            // var parameters = new
            // {
            //     korisnik.ime,
            //     korisnik.username,
            //     sifra,
            //     korisnik.opis,
            //     korisnik.zanrovi,
            //     korisnik.slika
            // };

            // Izvršavamo upit za ažuriranje korisnika
            await query.WithParams(parameters).ExecuteWithoutResultsAsync();

            // Uklanjamo stare veze "PREFERIRA"
            await _client.Cypher
                .Match("(k:Korisnik)-[r:PREFERIRA]->(z:Zanr)")
                .Where((Korisnik k) => k.username == usernameIzTokena)
                .Delete("r")
                .ExecuteWithoutResultsAsync();

            // Kreiramo nove veze "PREFERIRA"
            if (korisnik.zanrovi != null && korisnik.zanrovi.Count != 0)
            {
                await _client.Cypher
                    .Match("(k:Korisnik)", "(z:Zanr)")
                    .Where("k.username = $username AND z.id IN $zanroviIds")
                    .WithParams(new
                    {
                        username = usernameIzTokena,
                        zanroviIds = korisnik.zanrovi
                    })
                    .Create("(k)-[:PREFERIRA]->(z)")
                    .ExecuteWithoutResultsAsync();
            }

            return Ok("Korisnik je uspešno ažuriran.");
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Došlo je do greške: {ex.Message}");
        }
    }
    [HttpGet("preuzmiKorisnika/{idKorisnika}"), Authorize(Roles = "user")]
    public async Task<IActionResult> PreuzmiKorisnika(string idKorisnika)
    {
        try
        {
            var korisnik = await _client.Cypher
                .Match("(k:Korisnik)")
                .Where((Korisnik k) => k.id == idKorisnika)
                .Return(k => k.As<Korisnik>())
                .ResultsAsync;

            if (!korisnik.Any())
            {
                return NotFound($"Korisnik sa ID-em {idKorisnika} nije pronađena.");
            }

            return Ok(korisnik.First());
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Došlo je do greške: {ex.Message}");
        }
    }
    [HttpDelete("obrisiKorisnika/{idKorisnika}"), Authorize(Roles = "admin")]
    public async Task<IActionResult> ObrisiKorisnika(string idKorisnika)
    {
        if (string.IsNullOrWhiteSpace(idKorisnika))
        {
            return BadRequest("ID korisnika nije validan.");
        }

        try
        {

            // await _client.Cypher
            // .Match("(k:Korisnik)-[r:PREFERIRA]->(z:Zanr)")
            // .Where("k.id = $id")
            // .Delete("r")
            // .WithParam("id", idKorisnika)
            // .ExecuteWithoutResultsAsync();    suvisno?

            await _client.Cypher
                .Match("(k:Korisnik)")
                .Where("k.id = $id")
                .DetachDelete("k")
                .WithParam("id", idKorisnika)
                .ExecuteWithoutResultsAsync();

            return Ok("Korisnik je uspešno obrisana.");
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Došlo je do greške: {ex.Message}");
        }
    }


    [HttpPost]
    [Route("dodajPrijatelja/{idKorisnika2}"), Authorize(Roles = "user")]
    public async Task<ActionResult> DodajPrijatelja(string idKorisnika2)
    {
        if (string.IsNullOrEmpty(idKorisnika2))
        {
            return BadRequest("Podaci nisu validni.");
        }

        try
        {
            var usernameIzTokena = _userService.GetUser();
            if (usernameIzTokena == null)
            {
                return StatusCode(401, "Došlo je do greške prilikom preuzimanja informacija iz tokena.");
            }

            var korisnik = await _client.Cypher
                .Match("(k:Korisnik)")
                .Where((Korisnik k) => k.username == usernameIzTokena)
                .Return(k => k.As<Korisnik>())
                .ResultsAsync;

            if (!korisnik.Any())
            {
                return NotFound($"Korisnik nije pronađen.");
            }


            var prijatelj = await _client.Cypher
                .Match("(k:Korisnik)")
                .Where((Korisnik k) => k.id == idKorisnika2)
                .Return(k => k.As<Korisnik>())
                .ResultsAsync;

            if (!prijatelj.Any())
            {
                return NotFound($"Korisnik sa ID-em  {idKorisnika2} nije pronađen.");
            }

            var prijateljKorisnik = prijatelj.First(); // Prvo uzimamo korisnika sa liste

            // Dodati korisnika u listu prijatelja oba korisnika sa relacijom "JE_PRIJATELJ"
            await _client.Cypher
                .Match("(k1:Korisnik)", "(k2:Korisnik)")
                .Where((Korisnik k1) => k1.username == usernameIzTokena)
                .AndWhere((Korisnik k2) => k2.id == prijateljKorisnik.id)
                .Create("(k1)-[:JE_PRIJATELJ]->(k2)")
                .ExecuteWithoutResultsAsync();

            // await _client.Cypher
            //     .Match("(k1:Korisnik)", "(k2:Korisnik)")
            //     .Where((Korisnik k1) => k1.id == prijateljKorisnik.id)
            //     .AndWhere((Korisnik k2) => k2.id == idKorisnika1)
            //     .Create("(k1)-[:JE_PRIJATELJ]->(k2)")
            //     .ExecuteWithoutResultsAsync();

            return Ok("Uspešno ste postali prijatelji.");
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Došlo je do greške: {ex.Message}");
        }
    }

    [HttpDelete]
    [Route("ponistiPrijateljstvo/{idKorisnika2}"), Authorize(Roles = "user")]
    public async Task<ActionResult> PonistiPrijateljstvo(string idKorisnika2)
    {
        if (string.IsNullOrEmpty(idKorisnika2))
        {
            return BadRequest("Podaci nisu validni.");
        }

        try
        {
            var usernameIzTokena = _userService.GetUser();
            if (usernameIzTokena == null)
            {
                return StatusCode(401, "Došlo je do greške prilikom preuzimanja informacija iz tokena.");
            }



            // Proveri da li oba korisnika postoje
            var korisnik1 = await _client.Cypher
                .Match("(k:Korisnik)")
                .Where((Korisnik k) => k.username == usernameIzTokena)
                .Return(k => k.As<Korisnik>())
                .ResultsAsync;

            if (!korisnik1.Any())
            {
                return NotFound($"Korisnik  nije pronađen.");
            }

            var korisnik2 = await _client.Cypher
                .Match("(k:Korisnik)")
                .Where((Korisnik k) => k.id == idKorisnika2)
                .Return(k => k.As<Korisnik>())
                .ResultsAsync;

            if (!korisnik2.Any())
            {
                return NotFound($"Korisnik sa ID-em {idKorisnika2} nije pronađen.");
            }

            // Brisanje veze "JE_PRIJATELJ" u oba smera
            await _client.Cypher
                .Match("(k1:Korisnik)-[r:JE_PRIJATELJ]->(k2:Korisnik)")
                .Where((Korisnik k1) => k1.username == usernameIzTokena)
                .AndWhere((Korisnik k2) => k2.id == idKorisnika2)
                .Delete("r")
                .ExecuteWithoutResultsAsync();

            // await _client.Cypher
            //     .Match("(k1:Korisnik)-[r:JE_PRIJATELJ]->(k2:Korisnik)")
            //     .Where((Korisnik k1) => k1.id == idKorisnika2)
            //     .AndWhere((Korisnik k2) => k2.id == idKorisnika1)
            //     .Delete("r")
            //     .ExecuteWithoutResultsAsync();

            return Ok("Prijateljstvo je poništeno.");
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Došlo je do greške: {ex.Message}");
        }
    }

    [HttpGet]
    [Route("prikaziPrijatelje"), Authorize(Roles = "user")]
    public async Task<ActionResult<List<Korisnik>>> PrikaziPrijatelje()
    {
        try
        {
            var usernameIzTokena = _userService.GetUser();
            if (usernameIzTokena == null)
            {
                return StatusCode(401, "Došlo je do greške prilikom preuzimanja informacija iz tokena.");
            }

            var prijatelji = await _client.Cypher
                .Match("(k:Korisnik)-[:JE_PRIJATELJ]->(prijatelj:Korisnik)")
                .Where((Korisnik k) => k.username == usernameIzTokena)
                .Return(prijatelj => prijatelj.As<Korisnik>())
                .ResultsAsync;

            return Ok(prijatelji.ToList());
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Došlo je do greške: {ex.Message}");
        }
    }

    [HttpGet]
    [Route("vratiKorisnika/{query}"), Authorize(Roles = "user")]
    public async Task<ActionResult<KorisnikDTO>> VratiKorisnika(string query) //pretraga kao username
    {
        // try
        // {
        //     // Tražimo korisnika po username-u
        //     var rezultat = await _client.Cypher
        //         .Match("(k:Korisnik)")
        //         .Where((Korisnik k) => k.username == username)
        //         .Return(k => k.As<Korisnik>())
        //         .ResultsAsync;

        //     var korisnik = rezultat.FirstOrDefault();

        //     if (korisnik == null)
        //     {
        //         return NotFound($"Korisnik sa username-om '{username}' nije pronađen.");
        //     }


        //     var kor = new
        //     {
        //         Id = korisnik.id,
        //         Ime = korisnik.ime,
        //         Username = korisnik.username,
        //         Opis = korisnik.opis,
        //         Slika = korisnik.slika
        //     };

        //     return Ok(kor);
        // }
        try
        {

            var usernameIzTokena = _userService.GetUser();

            if (usernameIzTokena == null)
            {
                return StatusCode(401, "Došlo je do greške prilikom preuzimanja informacija iz tokena.");
            }

            IEnumerable<Korisnik> korisnici;

            if (string.IsNullOrWhiteSpace(query))
            {

                korisnici = await _client.Cypher
                    .Match("(k:Korisnik)")
                    .Where($"k.username <> '{usernameIzTokena}'")  // Isključivanje trenutnog korisnika
                    .Return(k => k.As<Korisnik>())
                    .ResultsAsync;
            }
            else
            {

                korisnici = await _client.Cypher
                    .Match("(k:Korisnik)")
                    .Where("toLower(k.username) CONTAINS toLower($query)")
                    .WithParam("query", query)
                    .AndWhere($"k.username <> '{usernameIzTokena}'")  // Isključivanje trenutnog korisnika
                    .Return(k => k.As<Korisnik>())
                    .ResultsAsync;
            }

            if (!korisnici.Any())
            {
                return NotFound($"Nijedan korisnik ne odgovara upitu '{query}'.");
            }

            return Ok(korisnici);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Došlo je do greške: {ex.Message}");
        }
    }
    [HttpDelete("obrisiProfil"), Authorize(Roles = "user")]
    public async Task<IActionResult> ObrisiProfil() //zelim i da ga automatski izloguje?
    {


        try
        {
            var usernameIzTokena = _userService.GetUser();
            if (usernameIzTokena == null)
            {
                return StatusCode(401, "Došlo je do greške prilikom preuzimanja informacija iz tokena.");
            }

            // await _client.Cypher
            // .Match("(k:Korisnik)-[r:PREFERIRA]->(z:Zanr)")
            // .Where("k.id = $id")
            // .Delete("r")
            // .WithParam("id", idKorisnika)
            // .ExecuteWithoutResultsAsync();    suvisno?

            await _client.Cypher
                .Match("(k:Korisnik)")
                //.Where("k.id = $id")
                .Where("k.username = $username")
                .DetachDelete("k")
                .WithParam("username", usernameIzTokena)
                .ExecuteWithoutResultsAsync();

            Response.Cookies.Delete("jwt");

            return Ok("Profil je uspešno obrisana.");
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Došlo je do greške: {ex.Message}");
        }
    }

    //--veza Citanje------------
    [HttpPost]
    [Route("citanjeKnjige/{knjigaId}"), Authorize(Roles = "user")]
    public async Task<ActionResult> CitanjeKnjige(string knjigaId)
    {
        try
        {
            var usernameIzTokena = _userService.GetUser();
            if (usernameIzTokena == null)
            {
                return StatusCode(401, $"Došlo je do greške prilikom preuzimanja informacija iz tokena");
            }
            //trazim korisnika sa datim username-om
            var rezultat = await _client.Cypher
                    .Match("(k:Korisnik)")
                    .Where((Korisnik k) => k.username == usernameIzTokena)
                    .Return(k => k.As<Korisnik>())
                    .ResultsAsync;

            var korisnik = rezultat.FirstOrDefault();

            if (korisnik == null)
            {
                return Unauthorized("Korisnik sa datim username-om ne postoji.");
            }

            await _client.Cypher
                .Match("(k:Korisnik)", "(knj:Knjiga)")
                .Where((Korisnik k) => k.id == korisnik.id)
                .AndWhere((Knjiga knj) => knj.id == knjigaId)
                .Create("(k)-[r:CITA]->(knj)")
                .Set("r.status = $status, r.trenutnaStrana = $trenutnaStrana")
                .WithParams(new
                {
                    status = "started",
                    trenutnaStrana = 0
                })
                .ExecuteWithoutResultsAsync();

            return Ok("Korisnik je zapoceo citanje knjige.");
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Došlo je do greške: {ex.Message}");
        }
    }

    [HttpPut]
    [Route("azurirajCitanje/{knjigaId}/{novaTrenutnaStrana}"), Authorize(Roles = "user")]
    public async Task<IActionResult> AzurirajCitanje(string knjigaId, int novaTrenutnaStrana)
    {
        if (novaTrenutnaStrana < 0)
        {
            return BadRequest("Trenutna strana ne može biti negativna.");
        }
        try
        {
            var usernameIzTokena = _userService.GetUser();
            if (usernameIzTokena == null)
            {
                return StatusCode(401, $"Došlo je do greške prilikom preuzimanja informacija iz tokena");
            }
            //trazim korisnika sa datim username-om
            var rezultat = await _client.Cypher
                    .Match("(k:Korisnik)")
                    .Where((Korisnik k) => k.username == usernameIzTokena)
                    .Return(k => k.As<Korisnik>())
                    .ResultsAsync;

            var korisnik = rezultat.FirstOrDefault();

            if (korisnik == null)
            {
                return Unauthorized("Korisnik sa datim username-om ne postoji.");
            }
            ///
             // Dohvatanje broja stranica za knjigu
            var brojStranicaRezultat = await _client.Cypher
                .Match("(b:Knjiga)")
                .Where((Knjiga b) => b.id == knjigaId)
                .Return(b => b.As<Knjiga>().brojStranica)
                .ResultsAsync;


            var brojStranica = brojStranicaRezultat.FirstOrDefault();

            if (brojStranica == 0)
            {
                return BadRequest("Knjiga sa datim ID-jem ne postoji ili nema definisan broj stranica.");
            }

            // Provera da li je trenutna strana validna
            if (novaTrenutnaStrana > brojStranica)
            {
                return BadRequest($"Trenutna strana ({novaTrenutnaStrana}) ne može biti veća od ukupnog broja stranica ({brojStranica}).");
            }

            ///

            await _client.Cypher
                .Match("(k:Korisnik)-[r:CITA]->(b:Knjiga)")
                .Where("k.id = $korisnikId AND b.id = $knjigaId")
                .Set("r.trenutnaStrana = $novaTrenutnaStrana")
                .With("r, b.brojStranica AS brojStrana, $novaTrenutnaStrana AS nts")
                .Set("r.status = CASE " +
                    "WHEN nts = 0 THEN 'started' " +
                    "WHEN nts = brojStrana THEN 'finished' " +
                    "ELSE 'in_progress' " +
                    "END")
                .WithParams(new
                {
                    korisnikId = korisnik.id,
                    knjigaId,
                    novaTrenutnaStrana
                })
                .ExecuteWithoutResultsAsync();

            return Ok("Cestitam, napredovali ste u citanju.");
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Došlo je do greške: {ex.Message}");
        }
    }

    // [HttpGet] //nije provereno jer ne mogu da vratim knjige, ne odgovaraju modelu
    // [Route("vratiKnjigeKojeCita"), Authorize(Roles = "user")]
    // public async Task<ActionResult> VratiKnjigeKojeCita()
    // {
    //     try
    //     {
    //         var usernameIzTokena = _userService.GetUser();
    //         if(usernameIzTokena == null)
    //         {
    //             return StatusCode(401, $"Došlo je do greške prilikom preuzimanja informacija iz tokena");
    //         }
    //          //trazim korisnika sa datim username-om
    //         var rezultat = await _client.Cypher
    //                 .Match("(k:Korisnik)")
    //                 .Where((Korisnik k) => k.username == usernameIzTokena)
    //                 .Return(k => k.As<Korisnik>())
    //                 .ResultsAsync;

    //         var korisnik = rezultat.FirstOrDefault();

    //         if (korisnik == null)
    //         {
    //             return Unauthorized("Korisnik sa datim username-om ne postoji.");
    //         }

    //         var knjige = await _client.Cypher
    //             .Match("(k:Korisnik)-[r:CITA]->(b:Knjiga)")
    //             .Where((Korisnik k) => k.id == korisnik.id)
    //             .AndWhere("b.status IN ['in_progress', 'started']")
    //             .Return(b => b.As<Knjiga>())
    //             .ResultsAsync;

    //         return Ok(knjige.ToList());
    //     }
    //     catch (Exception ex)
    //     {
    //         return StatusCode(500, $"Došlo je do greške: {ex.Message}");
    //     }

    // }

    [HttpGet]
    [Route("vratiKnjigeKojeCita"), Authorize(Roles = "user")]
    public async Task<ActionResult> VratiKnjigeKojeCita() //promenila sam zato sto veza ima status, a nema knjiga status dokle se stiglo i to
    {
        try
        {
            var usernameIzTokena = _userService.GetUser();
            if (usernameIzTokena == null)
            {
                return StatusCode(401, "Došlo je do greške prilikom preuzimanja informacija iz tokena.");
            }

            var rezultat = await _client.Cypher
                .Match("(k:Korisnik)")
                .Where((Korisnik k) => k.username == usernameIzTokena)
                .Return(k => k.As<Korisnik>())
                .ResultsAsync;

            var korisnik = rezultat.FirstOrDefault();

            if (korisnik == null)
            {
                return Unauthorized("Korisnik sa datim username-om ne postoji.");
            }

            var knjige = await _client.Cypher
                .Match("(k:Korisnik)-[r:CITA]->(b:Knjiga)", "(b:Knjiga)-[:IMA_AUTORA]->(a:Autor)")
                .Where((Korisnik k) => k.id == korisnik.id)
                .AndWhere("r.status IN ['started', 'in_progress']")
                .Return((b, r, a) => new
                {
                    Knjiga = b.As<Knjiga>(),
                    Autor = a.As<Autor>().punoIme,
                    Status = r.As<Citanje>().status,
                    TrenutnaStrana = r.As<Citanje>().trenutnaStrana
                })
                .ResultsAsync;

            if (!knjige.Any())
            {
                return NotFound("Korisnik trenutno ne čita nijednu knjigu.");
            }

            return Ok(knjige);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Došlo je do greške: {ex.Message}");
        }
    }


    // [HttpGet] //nije provereno jer ne mogu da vratim knjige, ne odgovaraju modelu
    // [Route("vratiProcitane"), Authorize(Roles = "user")]
    // public async Task<ActionResult> VratiProcitane()
    // {
    //     try
    //     {
    //         var usernameIzTokena = _userService.GetUser();
    //         if (usernameIzTokena == null)
    //         {
    //             return StatusCode(401, $"Došlo je do greške prilikom preuzimanja informacija iz tokena");
    //         }
    //         //trazim korisnika sa datim username-om
    //         var rezultat = await _client.Cypher
    //                 .Match("(k:Korisnik)")
    //                 .Where((Korisnik k) => k.username == usernameIzTokena)
    //                 .Return(k => k.As<Korisnik>())
    //                 .ResultsAsync;

    //         var korisnik = rezultat.FirstOrDefault();

    //         if (korisnik == null)
    //         {
    //             return Unauthorized("Korisnik sa datim username-om ne postoji.");
    //         }

    //         var knjige = await _client.Cypher
    //             .Match("(k:Korisnik)-[r:CITA]->(b:Knjiga)")
    //             .Where((Korisnik k) => k.id == korisnik.id)
    //             .AndWhere("b.status = 'finished'") //samo ova linija je razlika pa mozda moze spojiti u 1 funkciju!
    //             .Return(b => b.As<Knjiga>())
    //             .ResultsAsync;

    //         return Ok(knjige.ToList());
    //     }
    //     catch (Exception ex)
    //     {
    //         return StatusCode(500, $"Došlo je do greške: {ex.Message}");
    //     }

    // }

    // [HttpGet]
    // [Route("vratiProcitane"), Authorize(Roles = "user")]
    // public async Task<ActionResult> VratiProcitane()
    // {
    //     try
    //     {
    //         var usernameIzTokena = _userService.GetUser();
    //         if (usernameIzTokena == null)
    //         {
    //             return StatusCode(401, "Došlo je do greške prilikom preuzimanja informacija iz tokena.");
    //         }

    //         var rezultat = await _client.Cypher
    //             .Match("(k:Korisnik)")
    //             .Where((Korisnik k) => k.username == usernameIzTokena)
    //             .Return(k => k.As<Korisnik>())
    //             .ResultsAsync;

    //         var korisnik = rezultat.FirstOrDefault();

    //         if (korisnik == null)
    //         {
    //             return Unauthorized("Korisnik sa datim username-om ne postoji.");
    //         }

    //         var knjige = await _client.Cypher
    //             .Match("(k:Korisnik)-[r:CITA]->(b:Knjiga)")
    //             .Where((Korisnik k) => k.id == korisnik.id)
    //             .AndWhere("r.status = 'finished'")
    //             .Return((b, r) => new
    //             {
    //                 Knjiga = b.As<Knjiga>(),
    //                 Status = r.As<Citanje>().status,
    //                 TrenutnaStrana = r.As<Citanje>().trenutnaStrana
    //             })
    //             .ResultsAsync;

    //         if (!knjige.Any())
    //         {
    //             return NotFound("Korisnik nije pročitao nijednu knjigu.");
    //         }

    //         return Ok(knjige);
    //     }
    //     catch (Exception ex)
    //     {
    //         return StatusCode(500, $"Došlo je do greške: {ex.Message}");
    //     }
    // }
    [HttpGet]
    [Route("vratiProcitane"), Authorize(Roles = "user")]
    public async Task<ActionResult> VratiProcitane()
    {
        try
        {
            var usernameIzTokena = _userService.GetUser();
            if (usernameIzTokena == null)
            {
                return StatusCode(401, "Došlo je do greške prilikom preuzimanja informacija iz tokena.");
            }

            var rezultat = await _client.Cypher
                .Match("(k:Korisnik)")
                .Where((Korisnik k) => k.username == usernameIzTokena)
                .Return(k => k.As<Korisnik>())
                .ResultsAsync;

            var korisnik = rezultat.FirstOrDefault();

            if (korisnik == null)
            {
                return Unauthorized("Korisnik sa datim username-om ne postoji.");
            }

            var knjige = await _client.Cypher
                .Match("(k:Korisnik)-[r:CITA]->(b:Knjiga)", "(b:Knjiga)-[:IMA_AUTORA]->(a:Autor)")
                .Where((Korisnik k) => k.id == korisnik.id)
                .AndWhere("r.status = 'finished'")
                .Return((b, r, a) => new
                {
                    Knjiga = b.As<Knjiga>(),
                    Autor = a.As<Autor>().punoIme,
                    Status = r.As<Citanje>().status,
                    TrenutnaStrana = r.As<Citanje>().trenutnaStrana
                })
                .ResultsAsync;

            if (!knjige.Any())
            {
                return NotFound("Korisnik nije pročitao nijednu knjigu.");
            }

            return Ok(knjige);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Došlo je do greške: {ex.Message}");
        }
    }


    //-------------------logovanje-------------------------------------------------

    [HttpPost]
    [Route("registrujKorisnika")]
    public async Task<ActionResult> RegistrujKorisnika([FromBody] Korisnik korisnik)
    {
        if (korisnik == null)
        {
            return BadRequest("Podaci o korisniku nisu validni.");
        }

        try
        {
            //proveri da li vec postoji korisnik sa istim username-om
            var korisnikPostoji = await _client.Cypher
                    .Match("(u:Korisnik)")
                    .Where("u.username = $username")
                    .WithParam("username", korisnik.username)
                    .Return<bool>("u IS NOT NULL")
                    .ResultsAsync;

            if (korisnikPostoji.SingleOrDefault())
            {
                return Conflict("Korisnik sa datim username-om već postoji.");
            }

            // Validacija ID-eva žanrova
            var prosledjeniZanrovi = korisnik.zanrovi;

            if (prosledjeniZanrovi != null && prosledjeniZanrovi.Any())
            {
                var postojeciZanrovi = await _client.Cypher
                    .Match("(z:Zanr)")
                    .Where("z.id IN $ids")
                    .WithParam("ids", prosledjeniZanrovi)
                    .Return(z => z.As<Zanr>().id)
                    .ResultsAsync;

                // Proveri da li svi prosleđeni ID-evi postoje
                var nepostojeciZanrovi = prosledjeniZanrovi.Except(postojeciZanrovi).ToList();

                if (nepostojeciZanrovi.Any())
                {
                    return BadRequest($"Ne postoje sledeći ID-evi žanrova: {string.Join(", ", nepostojeciZanrovi)}");
                }
            }

            var korisnikId = Guid.NewGuid().ToString();

            string sifra = BCrypt.Net.BCrypt.HashPassword(korisnik.sifra);

            // Kreiranje korisnika u Neo4j
            await _client.Cypher
                .Create("(n:Korisnik {id: $id, ime: $ime, username: $username, sifra: $sifra, opis: $opis, zanrovi: $zanrovi, slika: $slika})")
                .WithParams(new
                {
                    id = korisnikId,
                    korisnik.ime,
                    korisnik.username,
                    sifra,
                    korisnik.opis,
                    zanrovi = prosledjeniZanrovi,
                    korisnik.slika
                })
                .ExecuteWithoutResultsAsync();

            // Kreiranje veza "PREFERIRA"
            if (prosledjeniZanrovi != null && prosledjeniZanrovi.Any())
            {
                await _client.Cypher
                    .Match("(k:Korisnik)", "(z:Zanr)")
                    .Where("k.id = $korisnikId AND z.id IN $zanroviIds")
                    .WithParams(new
                    {
                        korisnikId,
                        zanroviIds = prosledjeniZanrovi
                    })
                    .Create("(k)-[:PREFERIRA]->(z)")
                    .ExecuteWithoutResultsAsync();
            }


            return Ok("Korisnik je uspešno registrovan.");
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Došlo je do greške: {ex.Message}");
        }
    }

    [HttpPost("logujKorisnika/{username}/{sifra}")]
    public async Task<IActionResult> LogujKorisnika(string username, string sifra)
    {
        if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(sifra))
        {
            return BadRequest("Username ili sifra nisu uneti.");
        }
        try
        {
            //trazim korisnika sa datim username-om
            var rezultat = await _client.Cypher
                    .Match("(k:Korisnik)")
                    .Where((Korisnik k) => k.username == username)
                    .Return(k => k.As<Korisnik>())
                    .ResultsAsync;

            var korisnik = rezultat.FirstOrDefault();

            if (korisnik == null)
            {
                return Unauthorized("Korisnik sa datim username-om ne postoji.");
            }

            bool ispravnaSifra = BCrypt.Net.BCrypt.Verify(sifra, korisnik.sifra);
            if (!ispravnaSifra)
            {
                return Unauthorized("Pogrešna šifra.");
            }

            string jwt = CreateToken(username, sifra);
            Response.ContentType = "text/plain";

            Response.Cookies.Append("jwt", jwt, new CookieOptions
            {
                HttpOnly = true,
                Expires = DateTime.UtcNow.AddHours(1)
            });
            return Ok(jwt);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Došlo je do greške: {ex.Message}");
        }
    }

    [HttpPost("izlogujKorisnika"), Authorize(Roles = "user")]
    public IActionResult IzlogujKorisnika()
    {
        Response.Cookies.Delete("jwt");
        return Ok(new
        {
            message = "success"
        });
    }

    private string CreateToken(string username, string sifra)
    {

        List<Claim> claims = new List<Claim> {
                new Claim(ClaimTypes.Name, username),
                new Claim(ClaimTypes.Role, "user"),
            };

        if (administratori.Contains(username))
        {
            claims.Add(new Claim(ClaimTypes.Role, "admin"));
            Console.WriteLine("admin");
        }

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
            _configuration.GetSection("AppSettings:Token").Value!));

        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256Signature);

        var token = new JwtSecurityToken(
                claims: claims,
                expires: DateTime.Now.AddDays(1),
                signingCredentials: creds
            );

        var jwt = new JwtSecurityTokenHandler().WriteToken(token);

        return jwt;
    }

    [HttpPost]
    [Route("dodajOcenu"), Authorize(Roles = "user")]
    public async Task<ActionResult> DodajOcenu([FromBody] Ocena ocena)
    {
        if (ocena == null || ocena.ocena < 0 || ocena.ocena > 5)
        {
            return BadRequest("Podaci nisu validni. Ocena mora biti između 0 i 5.");
        }

        if (string.IsNullOrWhiteSpace(ocena.knjigaId) || string.IsNullOrWhiteSpace(ocena.komentar))
        {
            return BadRequest("Podaci nisu validni. Nedostaje ID knjige ili komentar.");
        }

        try
        {
            var usernameIzTokena = _userService.GetUser();
            if (usernameIzTokena == null)
            {
                return Unauthorized("Došlo je do greške prilikom preuzimanja informacija iz tokena.");
            }

            var korisnik = await _client.Cypher
                .Match("(k:Korisnik)")
                .Where((Korisnik k) => k.username == usernameIzTokena)
                .Return(k => k.As<Korisnik>())
                .ResultsAsync;

            if (korisnik == null)
            {
                return NotFound("Korisnik ne postoji.");
            }

            var knjiga = await _client.Cypher
                .Match("(kn:Knjiga)")
                .Where("kn.id = $knjigaId")
                .WithParam("knjigaId", ocena.knjigaId)
                .Return(kn => kn.As<object>())
                .ResultsAsync;

            if (knjiga == null)
            {
                return NotFound($"Knjiga sa ID-jem {ocena.knjigaId} ne postoji.");
            }

            // Provera da li veza već postoji
            var vezaPostoji = await _client.Cypher
                .Match("(k:Korisnik)-[r:OCENIO]->(kn:Knjiga)")
                .Where("k.username = $korisnikUsername AND kn.id = $knjigaId")
                .WithParams(new
                {
                    korisnikUsername = usernameIzTokena,
                    knjigaId = ocena.knjigaId
                })
                .Return(r => r.As<object>())
                .ResultsAsync;


            if (vezaPostoji.Any())
            {
                return Conflict("You have already rated this book.");//Bad
            }

            // Kreiranje veze
            await _client.Cypher
                .Match("(k:Korisnik)", "(kn:Knjiga)")
                .Where("k.username = $korisnikUsername AND kn.id = $knjigaId")
                .WithParams(new
                {
                    korisnikUsername = usernameIzTokena,
                    knjigaId = ocena.knjigaId,
                    ocena = ocena.ocena,
                    komentar = ocena.komentar,
                    //datum = DateTime.UtcNow
                })
                .Create("(k)-[:OCENIO {ocena: $ocena, komentar: $komentar}]->(kn)")
                .ExecuteWithoutResultsAsync();

            return Ok("Ocena je uspešno dodata.");
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Došlo je do greške: {ex.Message}");
        }
    }

    //preporuke

    // [HttpGet]
    // [Route("preporuciKnjige"), Authorize(Roles = "user")]
    // public async Task<ActionResult> PreporuciKnjige()
    // {
    //     try
    //     {
    //         var usernameIzTokena = _userService.GetUser();
    //         if (usernameIzTokena == null)
    //         {
    //             return StatusCode(401, "Došlo je do greške prilikom preuzimanja informacija iz tokena.");
    //         }

    //         var rezultat = await _client.Cypher
    //             .Match("(k:Korisnik)")
    //             .Where((Korisnik k) => k.username == usernameIzTokena)
    //             .Return(k => k.As<Korisnik>())
    //             .ResultsAsync;

    //         var korisnik = rezultat.FirstOrDefault();
    //         if (korisnik == null)
    //         {
    //             return NotFound("Korisnik nije pronađen.");
    //         }

    //         var knjigePoZanrovima = await _client.Cypher
    //             .Match("(knj:Knjiga)-[:PRIPADA_ZANRU]->(zanr:Zanr)")
    //             .Where("zanr.id IN $zanroviKorisnika")
    //             .WithParam("zanroviKorisnika", korisnik.zanrovi ?? new List<string>())
    //             .Return(knj => knj.As<Knjiga>())
    //             .ResultsAsync;

    //         var knjigeOdPrijatelja = await _client.Cypher
    //             .Match("(k:Korisnik)-[:JE_PRIJATELJ]->(prijatelj:Korisnik)-[:CITA]->(knj:Knjiga)")
    //             .Where((Korisnik k) => k.username == usernameIzTokena)
    //             .Return(knj => knj.As<Knjiga>())
    //             .ResultsAsync;

    //         var preporuceneKnjige = knjigePoZanrovima
    //             .Concat(knjigeOdPrijatelja)
    //             .DistinctBy(k => k.id) //uklanja ako se padnu kao duplikati
    //             .ToList();

    //         if (!preporuceneKnjige.Any())
    //         {
    //             return Ok("Nema dostupnih preporuka u ovom trenutku.");
    //         }

    //         return Ok(preporuceneKnjige);
    //     }
    //     catch (Exception ex)
    //     {
    //         return StatusCode(500, $"Došlo je do greške: {ex.Message}");
    //     }
    // }

    [HttpGet]
    [Route("preporuciKnjige"), Authorize(Roles = "user")]
    public async Task<ActionResult> PreporuciKnjige()
    {
        try
        {
            var usernameIzTokena = _userService.GetUser();
            if (usernameIzTokena == null)
            {
                return StatusCode(401, "Došlo je do greške prilikom preuzimanja informacija iz tokena.");
            }

            var rezultat = await _client.Cypher
                .Match("(k:Korisnik)")
                .Where((Korisnik k) => k.username == usernameIzTokena)
                .Return(k => k.As<Korisnik>())
                .ResultsAsync;

            var korisnik = rezultat.FirstOrDefault();
            if (korisnik == null)
            {
                return NotFound("Korisnik nije pronađen.");
            }

            var zanroviKorisnika = korisnik.zanrovi ?? new List<string>();

            var knjigeKojeKorisnikCita = await _client.Cypher
                .Match("(k:Korisnik)-[:CITA]->(knj:Knjiga)")
                .Where((Korisnik k) => k.username == usernameIzTokena)
                .Return(knj => knj.As<Knjiga>())
                .ResultsAsync;

            var idsKnjigaKojeKorisnikCita = knjigeKojeKorisnikCita.Select(k => k.id).ToList();

            var knjigeOdPrijatelja = await _client.Cypher
                .Match("(k:Korisnik)-[:JE_PRIJATELJ]->(prijatelj:Korisnik)-[:CITA]->(knj:Knjiga)-[:PRIPADA_ZANRU]->(zanr:Zanr)")
                .Match("(knj:Knjiga)-[:IMA_AUTORA]->(autor:Autor)")
                .Where((Korisnik k) => k.username == usernameIzTokena)
                .AndWhere("zanr.id IN $zanroviKorisnika")
                .AndWhere("NOT knj.id IN $idsKnjigaKojeKorisnikCita")
                .WithParams(new
                {
                    zanroviKorisnika,
                    idsKnjigaKojeKorisnikCita
                })
                .Return((knj, zanr, autor) => new
                {
                    Id = knj.As<Knjiga>().id,
                    Naslov = knj.As<Knjiga>().naslov,
                    Opis = knj.As<Knjiga>().opis,
                    Zanr = zanr.As<Zanr>().naziv,
                    Autor = autor.As<Autor>().punoIme,
                    Slika = knj.As<Knjiga>().slika,
                    BrojStranica = knj.As<Knjiga>().brojStranica,
                })
                .ResultsAsync;

            var preporuceneKnjige = knjigeOdPrijatelja
                .DistinctBy(k => k.Id)
                .ToList();

            if (!preporuceneKnjige.Any())
            {
                return Ok("Nema dostupnih preporuka u ovom trenutku.");
            }

            return Ok(preporuceneKnjige);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Došlo je do greške: {ex.Message}");
        }
    }



    [HttpGet]
    [Route("preporuciNaOsnovuOcenaPrijatelja"), Authorize(Roles = "user")]
    public async Task<ActionResult> PreporuciNaOsnovuOcenaPrijatelja()
    {
        try
        {
            var usernameIzTokena = _userService.GetUser();
            if (usernameIzTokena == null)
            {
                return StatusCode(401, "Došlo je do greške prilikom preuzimanja informacija iz tokena.");
            }

            var rezultat = await _client.Cypher
                .Match("(k:Korisnik)")
                .Where((Korisnik k) => k.username == usernameIzTokena)
                .Return(k => k.As<Korisnik>())
                .ResultsAsync;

            var korisnik = rezultat.FirstOrDefault();
            if (korisnik == null)
            {
                return NotFound("Korisnik nije pronađen.");
            }

            var dobroOcenjene = await _client.Cypher
            .Match("(k:Korisnik)-[:JE_PRIJATELJ]->(prijatelj:Korisnik)")
            .Where((Korisnik k) => k.id == korisnik.id)

            .Match("(prijatelj)-[o:OCENIO]->(knjiga:Knjiga)")
            .Where("o.ocena >= 4.0") // "dobro" ocenili?
            //necu da vratim ako korisnik to vec cita/procitao
            .AndWhere("NOT EXISTS((k)-[:CITA]->(knjiga))")

            //ovde koristim Match, a ne OptionalMatch, jer znam da su veze obavezne!
            .Match("(knjiga)-[:PRIPADA_ZANRU]->(zanr:Zanr)")
            .Match("(knjiga)-[:IMA_AUTORA]->(autor:Autor)")

           .Return((knjiga, zanr, autor) => new
           {
               Id = knjiga.As<Knjiga>().id,
               Naslov = knjiga.As<Knjiga>().naslov,
               Opis = knjiga.As<Knjiga>().opis,
               Zanr = zanr.As<Zanr>().naziv,
               Autor = autor.As<Autor>().punoIme,
               Slika = knjiga.As<Knjiga>().slika,
               BrojStranica = knjiga.As<Knjiga>().brojStranica,
           })
            .ResultsAsync;

            var preporuceneKnjige = dobroOcenjene.DistinctBy(k => k.Id).ToList();

            if (preporuceneKnjige.Count == 0)
            {
                return Ok("Nema dostupnih preporuka u ovom trenutku.");
            }

            return Ok(preporuceneKnjige);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Došlo je do greške: {ex.Message}");
        }
    }

    [HttpGet]
    [Route("VratiBrojPrijatelja"), Authorize(Roles = "user")]
    public async Task<ActionResult<List<Korisnik>>> VratiBrojPrijatelja()
    {
        try
        {
            var usernameIzTokena = _userService.GetUser();
            if (usernameIzTokena == null)
            {
                return StatusCode(401, "Došlo je do greške prilikom preuzimanja informacija iz tokena.");
            }

            var prijatelji = await _client.Cypher
                .Match("(k:Korisnik)-[:JE_PRIJATELJ]->(prijatelj:Korisnik)")
                .Where((Korisnik k) => k.username == usernameIzTokena)
                .Return(prijatelj => prijatelj.As<Korisnik>())
                .ResultsAsync;

            return Ok(prijatelji.ToList().Count);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Došlo je do greške: {ex.Message}");
        }
    }

    [HttpGet("VratiLogovanogKorisnika"), Authorize(Roles = "user")]
    public async Task<IActionResult> VratiLogovanogKorisnika()
    {
        try
        {
            var usernameIzTokena = _userService.GetUser();
            if (usernameIzTokena == null)
            {
                return StatusCode(401, "Došlo je do greške prilikom preuzimanja informacija iz tokena.");
            }

            var korisnik = await _client.Cypher
                .Match("(k:Korisnik)")
                .Where((Korisnik k) => k.username == usernameIzTokena)
                .Return(k => k.As<Korisnik>())
                .ResultsAsync;

            if (!korisnik.Any())
            {
                return NotFound($"Korisnik  nije pronađena.");
            }

            return Ok(new
            {
                korisnik = korisnik.First(),
                jeAdmin = administratori.Contains(usernameIzTokena),
            }
            );
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Došlo je do greške: {ex.Message}");
        }
    }

    [HttpGet]
    [Route("vratiSveKorisnike"), Authorize(Roles = "user")]
    public async Task<ActionResult> VratiSveKorisnike()
    {
        try
        {
            var usernameIzTokena = _userService.GetUser();

            if (usernameIzTokena == null)
            {
                return StatusCode(401, "Došlo je do greške prilikom preuzimanja informacija iz tokena.");
            }

            var korisnici = await _client.Cypher
                .Match("(k:Korisnik)")
                .Where($"k.username <> '{usernameIzTokena}'")
                .Return(k => k.As<Korisnik>())
                .ResultsAsync;

            if (korisnici == null || !korisnici.Any())
            {
                return NotFound("Nema zanrova u bazi.");
            }

            return Ok(korisnici);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Došlo je do greške: {ex.Message}");
        }
    }

}