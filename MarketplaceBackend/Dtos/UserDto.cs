namespace MarketplaceBackend.Dtos
{
    public class UserDto
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string Role { get; set; } = "Buyer";
        public string Name { get; set; } = string.Empty;
    }
}
