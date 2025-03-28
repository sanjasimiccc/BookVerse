using DomainModel;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Neo4jClient;

namespace Controllers;

[ApiController]
[Route("[controller]")]
public class ZanrController : ControllerBase
{
    private readonly IGraphClient _client;

    public ZanrController(IGraphClient client)
    {
        _client = client;
    }
    [HttpPost]
    [Route("dodajZanr"), Authorize(Roles = "admin")]
    public async Task<ActionResult> DodajZanr([FromBody] Zanr zanr)
    {
        if (zanr == null)
        {
            return BadRequest("Podaci o zanru nisu validni.");
        }

        try
        {
            await _client.Cypher
                .Create("(n:Zanr {id: $id, naziv: $naziv, slika: $slika})")
                .WithParams(new
                {
                    id = Guid.NewGuid().ToString(),
                    zanr.naziv,
                    zanr.slika
                })
                .ExecuteWithoutResultsAsync();

            return Ok("Zanr je uspešno dodat.");
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Došlo je do greške: {ex.Message}");
        }
    }

    [HttpGet]
    [Route("vratiSveZanrove")]
    public async Task<ActionResult> VratiSveZanrove()
    {
        try
        {
            var zanrovi = await _client.Cypher
                .Match("(a:Zanr)")
                .Return(a => a.As<Zanr>())
                .ResultsAsync;

            if (zanrovi == null || !zanrovi.Any())
            {
                return NotFound("Nema zanrova u bazi.");
            }

            return Ok(zanrovi);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Došlo je do greške: {ex.Message}");
        }
    }

    [HttpGet]
    [Route("vratiZanr/{id}")]
    public async Task<ActionResult> VratiZanr(string id) //dal nam treba?
    {
        try
        {
            var result = await _client.Cypher
                .Match("(z:Zanr)")
                .Where((Zanr z) => z.id == id)
                .Return(z => z.As<Zanr>())
                .ResultsAsync;

            if (result == null || !result.Any())
            {
                return NotFound($"Zanr sa ID-jem {id} nije pronađen.");
            }

            return Ok(result.First());  // vracamo prvi (jedini) zanr
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Došlo je do greške: {ex.Message}");
        }
    }

    [HttpDelete]
    [Route("obrisiZanr/{id}"), Authorize(Roles = "admin")]
    public async Task<ActionResult> ObrisiZanr(string id)
    {
        try
        {
            var result = await _client.Cypher
                .Match("(z:Zanr)")
                .Where((Zanr z) => z.id == id)
                .Return<int>("count(z)")
                .ResultsAsync;

            if (result.FirstOrDefault() == 0)
            {
                return NotFound($"Zanr sa ID-jem {id} nije pronađen.");
            }

            // Proveravamo da li postoji veza PREFERIRA od Korisnik ka Zanr
            var preferiraCount = await _client.Cypher
                .Match("(k:Korisnik)-[:PREFERIRA]->(z:Zanr)")
                .Where((Zanr z) => z.id == id)
                .Return<int>("count(k)")
                .ResultsAsync;

            // Proveravamo da li postoji veza PRIPADA_ZANRU od Knjiga ka Zanr
            var pripadaZanruCount = await _client.Cypher
                .Match("(kn:Knjiga)-[:PRIPADA_ZANRU]->(z:Zanr)")
                .Where((Zanr z) => z.id == id)
                .Return<int>("count(kn)")
                .ResultsAsync;

            // Ako postoji makar jedna od ovih veza, onemogućavamo brisanje
            if (preferiraCount.FirstOrDefault() > 0 || pripadaZanruCount.FirstOrDefault() > 0)
            {
                Console.WriteLine($"Preferira count: {preferiraCount.FirstOrDefault()}, Pripada Zanru count: {pripadaZanruCount.FirstOrDefault()}");
                return BadRequest($"Zanr sa ID-jem {id} ne može biti obrisan jer je povezan sa korisnicima ili knjigama.");
            }

            await _client.Cypher
                .Match("(z:Zanr)")
                .Where((Zanr z) => z.id == id)
                .Delete("z")
                //.DetachDelete("z")  // brišemo zanr i sve povezane relacije
                .ExecuteWithoutResultsAsync();

            return Ok($"Zanr sa ID-jem {id} je uspešno obrisan.");
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Došlo je do greške: {ex.Message}");
        }
    }

    [HttpGet]
    [Route("vrati3NajcitanijeKnjigeZanra/{zanrID}")]
    public async Task<ActionResult> Vrati3NajcitanijeKnjigeZanra(string zanrID)
    {
        var top3 = await _client.Cypher
            .Match("(k:Knjiga)-[:PRIPADA_ZANRU]->(z:Zanr)")
            .Match("(k)-[:IMA_AUTORA]->(autor:Autor)")
            .Match("(k)<-[r:CITA]-()")
            .Where((Zanr z) => z.id == zanrID)
            .With("k, COUNT(r) AS brojCitanja, autor")
            .OrderByDescending("brojCitanja")
            .Limit(3)
            //.Return(k => k.As<Knjiga>())
            .Return((k, brojCitanja, autor) => new
            {
                Id = k.As<Knjiga>().id,
                Naslov = k.As<Knjiga>().naslov,
                //Opis = k.As<Knjiga>().opis,
                Slika = k.As<Knjiga>().slika,
                //BrojStranica = k.As<Knjiga>().brojStranica,
                BrojCitanja = brojCitanja.As<int>(),
                Autor = autor.As<Autor>().punoIme,
            })
            .ResultsAsync;

        return Ok(top3.ToList());
    }

}


