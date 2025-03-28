using DomainModel;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Neo4jClient;
using Neo4jClient.Cypher;

namespace Controllers;

[ApiController]
[Route("[controller]")]
public class KnjigaController : ControllerBase
{
    private readonly IGraphClient _client;

    public KnjigaController(IGraphClient client)
    {
        _client = client;
    }

    [HttpPost]
    [Route("dodavanjeKnjige"), Authorize(Roles = "admin")]
    public async Task<ActionResult> DodavanjeKnjige([FromBody] Knjiga knjiga)
    {
        if (knjiga == null)
        {
            return BadRequest("Podaci o knjizi nisu validni.");
        }

        try
        {
            var autorPostoji = await _client.Cypher
                .Match("(a:Autor)")
                .Where((Autor a) => a.id == knjiga.autor)
                .Return(a => a.As<Autor>())
                .ResultsAsync;

            if (!autorPostoji.Any())
            {
                return NotFound($"Autor sa ID-jem {knjiga.autor} ne postoji.");
            }

            var zanrPostoji = await _client.Cypher
                .Match("(z:Zanr)")
                .Where((Zanr z) => z.id == knjiga.zanr)
                .Return(z => z.As<Zanr>())
                .ResultsAsync;

            if (!zanrPostoji.Any())
            {
                return NotFound($"Žanr sa ID-jem {knjiga.zanr} ne postoji.");
            }

            var knjigaId = Guid.NewGuid().ToString();

            await _client.Cypher
                .Match("(a:Autor)", "(z:Zanr)")
                .Where((Autor a) => a.id == knjiga.autor)
                .AndWhere((Zanr z) => z.id == knjiga.zanr)
                .Create("(k:Knjiga {id: $id, naslov: $naslov, opis: $opis, slika: $slika, brojStranica: $brojStranica})")
                .WithParams(new
                {
                    id = knjigaId,
                    naslov = knjiga.naslov,
                    opis = knjiga.opis,
                    slika = knjiga.slika,
                    //prosecnaOcena = knjiga.prosecnaOcena,
                    brojStranica = knjiga.brojStranica
                })
                .Create("(k)-[:IMA_AUTORA]->(a)")
                .Create("(k)-[:PRIPADA_ZANRU]->(z)")
                .ExecuteWithoutResultsAsync();

            return Ok("Knjiga je uspešno dodata");
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Došlo je do greške: {ex.Message}");
        }
    }


    // [HttpDelete("obrisiKnjigu/{idKnjige}"), Authorize(Roles = "admin")]
    // public async Task<IActionResult> ObrisiKnjigu(string idKnjige)
    // {
    //     if (string.IsNullOrWhiteSpace(idKnjige))
    //     {
    //         return BadRequest("ID knjige nije validan.");
    //     }

    //     try
    //     {
    //         await _client.Cypher
    //             .Match("(k:Knjiga)")
    //             .Where("k.id = $id")
    //             .DetachDelete("k")
    //             .WithParam("id", idKnjige)
    //             .ExecuteWithoutResultsAsync();

    //         return Ok("Knjiga je uspešno obrisana.");
    //     }
    //     catch (Exception ex)
    //     {
    //         return StatusCode(500, $"Došlo je do greške: {ex.Message}");
    //     }
    // }
    [HttpDelete("obrisiKnjigu/{idKnjige}"), Authorize(Roles = "admin")]
    public async Task<IActionResult> ObrisiKnjigu(string idKnjige)
    {
        if (string.IsNullOrWhiteSpace(idKnjige))
        {
            return BadRequest("ID knjige nije validan.");
        }

        try
        {
            // Proveri da li knjiga ima korisnike koji je čitaju
            var knjigaICitaoci = await _client.Cypher
                .Match("(knj:Knjiga)<-[:CITA]-(k:Korisnik)")
                .Where((Knjiga k) => k.id == idKnjige)
                .Return(k => k.As<Korisnik>())
                .ResultsAsync;

            // Ako postoji bar jedan korisnik koji čita knjigu, ne dozvoliti brisanje
            if (knjigaICitaoci.Any())
            {
                return BadRequest("Knjiga se ne može obrisati jer je trenutno u procesu čitanja od strane korisnika.");
            }

            // Ako nema korisnika koji je čita, obriši knjigu
            await _client.Cypher
                .Match("(k:Knjiga)")
                .Where((Knjiga k) => k.id == idKnjige)
                .DetachDelete("k")
                .ExecuteWithoutResultsAsync(); //koja je razlika???????????

            return Ok("Knjiga je uspešno obrisana.");
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Došlo je do greške: {ex.Message}");
        }
    }


    [HttpPut("azurirajKnjigu/{idKnjige}"), Authorize(Roles = "admin")]
    public async Task<IActionResult> AzurirajKnjigu(string idKnjige, [FromBody] KnjigaDTO knjiga)
    {
        if (knjiga == null)
        {
            return BadRequest("Podaci nisu validni.");
        }

        try
        {
            var bookExists = await _client.Cypher
                .Match("(k:Knjiga)")
                .Where((Knjiga k) => k.id == idKnjige)
                .Return<int>("count(k)")
                .ResultsAsync;


            if (bookExists.FirstOrDefault() == 0)
            {
                return NotFound($"Knjiga sa ID-em {idKnjige} nije pronađena.");
            }

            var query = _client.Cypher.Match("(k:Knjiga)")
                .Where((Knjiga k) => k.id == idKnjige);

            if (!string.IsNullOrEmpty(knjiga.opis))
            {
                query = query.Set("k.opis = $opis");
            }

            if (!string.IsNullOrEmpty(knjiga.slika))
            {
                query = query.Set("k.slika = $slika");
            }

            if (knjiga.brojStranica > 0)
            {
                query = query.Set("k.brojStranica = $brojStranica");
            }

            var parameters = new
            {
                knjiga.opis,
                knjiga.slika,
                knjiga.brojStranica,
            };

            await query.WithParams(parameters).ExecuteWithoutResultsAsync();

            return Ok("Knjiga je uspešno ažurirana.");
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Došlo je do greške: {ex.Message}");
        }
    }

    // [HttpGet("preuzmiKnjigu/{idKnjige}"), Authorize(Roles = "user")]
    // public async Task<IActionResult> PreuzmiKnjigu(string idKnjige)
    // {
    //     try
    //     {
    //         var knjiga = await _client.Cypher
    //             .Match("(k:Knjiga)")
    //             .Where((Knjiga k) => k.id == idKnjige)
    //             .Return(k => k.As<Knjiga>())
    //             .ResultsAsync;

    //         if (!knjiga.Any())
    //         {
    //             return NotFound($"Knjiga sa ID-em {idKnjige} nije pronađena.");
    //         }

    //         return Ok(knjiga.First());
    //     }
    //     catch (Exception ex)
    //     {
    //         return StatusCode(500, $"Došlo je do greške: {ex.Message}");
    //     }
    // }
    [HttpGet("preuzmiKnjigu/{idKnjige}"), Authorize(Roles = "user")] //menjano
    public async Task<IActionResult> PreuzmiKnjigu(string idKnjige)
    {
        try
        {
            // Modifikovan upit koji vraća knjigu, autora i žanr
            var knjiga = await _client.Cypher
                .Match("(k:Knjiga)-[:IMA_AUTORA]->(a:Autor)", "(k)-[:PRIPADA_ZANRU]->(z:Zanr)")
                .Where((Knjiga k) => k.id == idKnjige)
                .Return((k, a, z) => new
                {
                    Knjiga = k.As<Knjiga>(),
                    Autor = a.As<Autor>(),
                    Zanr = z.As<Zanr>().naziv
                })
                .ResultsAsync;

            if (!knjiga.Any())
            {
                return NotFound($"Knjiga sa ID-em {idKnjige} nije pronađena.");
            }

            var knjigaInfo = knjiga.First();


            return Ok(knjigaInfo);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Došlo je do greške: {ex.Message}");
        }
    }


    [HttpGet]
    [Route("vratiKnjigePoZanru/{idZanra}/{rBrStranice}/{brKnjigaPoStranici}"), Authorize(Roles = "user")]
    public async Task<ActionResult> VratiKnjigePoZanru(string idZanra, int rBrStranice, int brKnjigaPoStranici)
    {
        if (rBrStranice < 1 || brKnjigaPoStranici < 1)
        {
            return BadRequest("Parametri stranice moraju biti pozitivni brojevi.");
        }
        int skip = (rBrStranice - 1) * brKnjigaPoStranici;

        try
        {
            var brojKnjiga = await _client.Cypher
                .Match("(k:Knjiga)-[:PRIPADA_ZANRU]->(z:Zanr)")
                .Where((Zanr z) => z.id == idZanra)
                .Return<int>("count(k)")
                .ResultsAsync;

            var knjige = await _client.Cypher
                .Match("(k:Knjiga)-[:PRIPADA_ZANRU]->(z:Zanr)")
                .Where((Zanr z) => z.id == idZanra)
                .Match("(k:Knjiga)-[:IMA_AUTORA]->(a:Autor)")
                .Return((k, a) => new
                {
                    Id = k.As<Knjiga>().id,
                    Naslov = k.As<Knjiga>().naslov,
                    Slika = k.As<Knjiga>().slika,
                    Autor = a.As<Autor>().punoIme
                })
                .Skip(skip)
                .Limit(brKnjigaPoStranici)
                .ResultsAsync;

            bool kraj = knjige.Count() < brKnjigaPoStranici || (knjige.Count() == brKnjigaPoStranici && rBrStranice * brKnjigaPoStranici == brojKnjiga.FirstOrDefault());
            Console.WriteLine("kraj " + kraj );

            return Ok(new
            {
                Knjige = knjige.Any() ? knjige : [],
                Kraj = kraj
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Došlo je do greške: {ex.Message}");
        }
    }

    // [HttpGet]
    // [Route("vratiKnjigePoAutoru/{idAutora}"), Authorize(Roles = "user")]
    // public async Task<ActionResult> VratiKnjigePoAutoru(string idAutora)
    // {
    //     try
    //     {
    //         var knjige = await _client.Cypher
    //             .Match("(k:Knjiga)-[:IMA_AUTORA]->(a:Autor)")
    //             .Where((Autor a) => a.id == idAutora)
    //             .Return((k, a) => new
    //             {
    //                 Knjiga = k.As<Knjiga>(),
    //             })
    //             .ResultsAsync;

    //         if (!knjige.Any())
    //         {
    //             return NotFound($"Nema knjiga autora sa ID-em {idAutora}.");
    //         }

    //         return Ok(knjige);
    //     }
    //     catch (Exception ex)
    //     {
    //         return StatusCode(500, $"Došlo je do greške: {ex.Message}");
    //     }
    // }

    [HttpGet]
    [Route("vratiKnjigePoAutoru/{idAutora}/{idKnjigeZaIzostaviti?}"), Authorize(Roles = "user")]
    public async Task<ActionResult> VratiKnjigePoAutoru(string idAutora, string? idKnjigeZaIzostaviti = null)
    {
        try
        {
            var knjige = await _client.Cypher
                .Match("(k:Knjiga)-[:IMA_AUTORA]->(a:Autor)")
                .Where((Autor a) => a.id == idAutora)
                .AndWhere(idKnjigeZaIzostaviti == null ? "true" : "k.id <> $idKnjigeZaIzostaviti")
                .WithParam("idKnjigeZaIzostaviti", idKnjigeZaIzostaviti)
                .Return(k => k.As<Knjiga>())
                .ResultsAsync;


            if (!knjige.Any())
            {
                return Ok(new List<Knjiga>());
            }

            return Ok(knjige);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Došlo je do greške: {ex.Message}");
        }
    }


    [HttpGet]
    [Route("pretragaKnjigePoNaslovu/{naslov}"), Authorize(Roles = "user")]
    public async Task<ActionResult> PretraziKnjigePoNaslovu(string naslov)
    {
        try
        {
            if (naslov == null || naslov == "")
            {
                return BadRequest("Morati uneti makar 1 karakter za pretragu!");
            }

            var knjige = await _client.Cypher
                .Match("(k:Knjiga)")
                .Match("(k:Knjiga)-[:IMA_AUTORA]->(a:Autor)")
                .Where("toLower(k.naslov) CONTAINS toLower($naslov)")
                .WithParam("naslov", naslov)
                .Return((k, a) => new
                {
                    Id = k.As<Knjiga>().id,
                    Naslov = k.As<Knjiga>().naslov,
                    Slika = k.As<Knjiga>().slika,
                    Autor = a.As<Autor>().punoIme
                })
                .ResultsAsync;
            return Ok(knjige.Any() ? knjige : []);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Došlo je do greške: {ex.Message}");
        }
    }

    [HttpGet]
    [Route("vratiKomentareIOcenuKnjige/{idKnjige}"), Authorize(Roles = "user")]
    public async Task<ActionResult> vratiKomentareIOcenuKnjige(string idKnjige)
    {

        try
        {
            // Provera postojanja knjige
            var knjigaPostoji = await _client.Cypher
                .Match("(kn:Knjiga)")
                .Where("kn.id = $knjigaId")
                .WithParam("knjigaId", idKnjige)
                .Return(kn => kn.As<object>())
                .ResultsAsync;

            if (!knjigaPostoji.Any())
            {
                return NotFound($"Knjiga sa ID-jem {idKnjige} ne postoji.");
            }

            // Dohvatanje komentara i ocena
            var komentariIOcene = await _client.Cypher
                .Match("(k:Korisnik)-[o:OCENIO]->(kn:Knjiga)")
                .Where("kn.id = $knjigaId")
                .WithParam("knjigaId", idKnjige)
                .Return((k, o) => new
                {
                    KorisnikIme = k.As<Korisnik>().ime,
                    Ocena = o.As<Ocena>()
                })
                .ResultsAsync;

            // if (!komentariIOcene.Any())
            // {
            //     return Ok(komentariIOcene); //da li ovo ovako?????????????
            // }
            if (!komentariIOcene.Any())
            {
                return Ok(new { ProsecnaOcena = 0, Komentari = new List<object>() });
            }


            // Izračunavanje prosečne ocene
            var prosecnaOcena = komentariIOcene
                .Select(kio => (double)kio.Ocena.ocena)
                .Average();

            // Formatiranje pojedinačnih komentara
            var komentari = komentariIOcene.Select(kio => new
            {
                KorisnikIme = kio.KorisnikIme,
                Komentar = kio.Ocena.komentar,
                Ocena = kio.Ocena.ocena //menjala sammmm ovo, dodala sam da bi mi se videla i ocena
            }).ToList();

            // Vraćanje rezultata
            return Ok(new
            {
                ProsecnaOcena = Math.Round(prosecnaOcena, 2), // Zaokružujemo na 2 decimale
                Komentari = komentari
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Došlo je do greške: {ex.Message}");
        }

    }


    [HttpGet]
    [Route("vratiSveKnjige/{rBrStranice}/{brKnjigaPoStranici}"), Authorize(Roles = "user")]
    public async Task<ActionResult> VratiSveKnjige(int rBrStranice, int brKnjigaPoStranici)
    {
        if (rBrStranice < 1 || brKnjigaPoStranici < 1)
        {
            return BadRequest("Parametri stranice moraju biti pozitivni brojevi.");
        }
        int skip = (rBrStranice - 1) * brKnjigaPoStranici;
        try
        {

            var brojKnjiga = await _client.Cypher
                .Match("(k:Knjiga)")
                .Return<int>("count(k)")
                .ResultsAsync;

            var knjige = await _client.Cypher
                .Match("(k:Knjiga)") // Selektujemo samo čvor Knjiga
                .Match("(k:Knjiga)-[:IMA_AUTORA]->(a:Autor)")
                .Return((k, a) => new
                {
                    Id = k.As<Knjiga>().id,
                    Naslov = k.As<Knjiga>().naslov,
                    Slika = k.As<Knjiga>().slika,
                    Autor = a.As<Autor>().punoIme
                })
                .Skip(skip) //preskacem prethodne rezultate
                .Limit(brKnjigaPoStranici) //ogranicavam broj knjiga po stranici
                .ResultsAsync;

            if (!knjige.Any())
            {
                return NotFound($"Nema dostupnih knjiga");
            }
            bool kraj = false;

            if (knjige.Count() < brKnjigaPoStranici || (knjige.Count() == brKnjigaPoStranici && rBrStranice * brKnjigaPoStranici == brojKnjiga.FirstOrDefault()))
            {
                kraj = true;
            }

            return Ok(new
            {
                Knjige = knjige,
                Kraj = kraj
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Došlo je do greške: {ex.Message}");
        }
    }





}