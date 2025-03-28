namespace DomainModel;
public class Korisnik
{
    public String? id { get; set; }
    public required String ime { get; set; }

    public required String username { get; set; }

    public required String sifra { get; set; }

    public String? opis { get; set; } //tipa koje knjige voli, ili bilo sta

   // public List<Zanr>? zanrovi { get; set; }  //checkboxes koji ga zanrovi interesuju 
   public List<String>? zanrovi { get; set; } //id!!

    public String? slika { get; set; }

    public List<Korisnik>? prijatelji { get; set; }  //ovo nam ne treba?

    //public List<Knjiga>? procitaneKnjige { get; set; } //na stranici korisnika da budu kao knjige koje je procitao



}