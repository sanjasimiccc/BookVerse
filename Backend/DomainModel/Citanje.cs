using DomainModel;

public class Citanje
{
    public required Korisnik korisnik { get; set; }

    public required Knjiga knjiga { get; set; }

    public required String status { get; set; } //read later, reading, finished  | started || in_progress || finished 

    public int trenutnaStrana { get; set; } //za pracenje progresa u citanju

}