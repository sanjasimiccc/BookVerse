using System.Text.Json.Serialization;
using DomainModel;

public class Autor
{

    public String? id { get; set; }
    public required String punoIme { get; set; } 
    public required String biografija { get; set; } 
    public required String slika { get; set; } //dodala sam
    
    [JsonIgnore]  // Sprečava da "knjige" budu serijalizovane i prikazane u Swaggeru
    public  List<Knjiga>? knjige { get; set; } //jer inicijalno mu nisu pridruzene knjige
}