namespace DomainModel;

public class Ocena
{
    //public required Korisnik korisnik { get; set; }

    public String? komentar { get; set; }

    public required float ocena { get; set; }

    public required string korisnikId { get; set; }
    public required string knjigaId { get; set; }

   // public required Knjiga knjiga { get; set; }


}