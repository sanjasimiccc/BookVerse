using System.Text.Json.Serialization;
using DomainModel;

public class Zanr
{
    public String? id { get; set; }
    public required String naziv { get; set; }
    public required String slika { get; set; }

    [JsonIgnore]
    public List<Knjiga>? knjige { get; set; } //inicijalno je prazna lista
}