using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Net.Http;
using MarketplaceBackend.Data;
using MarketplaceBackend.Dtos;
using Newtonsoft.Json.Linq;

namespace MarketplaceBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly MarketplaceContext _context;
        private readonly IConfiguration _configuration;

        public UsersController(MarketplaceContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        [AllowAnonymous]
        [HttpPost("register")]
        public async Task<IActionResult> Register(UserDto userDto)
        {

            var existingUser = _context.Users.FirstOrDefault(u => u.Email == userDto.Email);
            if (existingUser != null)
            {
                return Conflict(new { message = "A user with this email already exists." });
            }

            using var client = new HttpClient();
            client.BaseAddress = new Uri(_configuration["Supabase:ApiUrl"]);
            client.DefaultRequestHeaders.Add("apikey", _configuration["Supabase:ApiKey"]);
            client.DefaultRequestHeaders.Add("Authorization", $"Bearer {_configuration["Supabase:ApiKey"]}");

            var response = await client.PostAsJsonAsync("/auth/v1/signup", new
            {
                email = userDto.Email,
                password = userDto.Password,
                data = new
                {
                    role = userDto.Role,
                    name = userDto.Name
                }
            });

            var responseBody = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                return BadRequest(new { message = "Error: " + responseBody });
            }

            JObject supabaseResponse = JObject.Parse(responseBody);
            var supabaseUserId = (string?)supabaseResponse["id"];

            if (string.IsNullOrEmpty(supabaseUserId))
            {
               return BadRequest(new { message = "Could not parse user 'id' from Supabase signup response: " + responseBody });
            }

            var localUser = new User
            {
                SupabaseUserId = supabaseUserId,
                Email = userDto.Email,
                Role = userDto.Role,
                Name = userDto.Name
            };

            _context.Users.Add(localUser);
            _context.SaveChanges();

            return Ok(new { message = "User registered successfully." });
        }


        [HttpGet]
        public IActionResult GetUsers()
        {
            return Ok(_context.Users.ToList());
        }

        [Authorize]
        [HttpGet("supabase/{supabaseUserId}/credits")]
        public IActionResult GetUserCredits(string supabaseUserId)
        {
            Console.WriteLine("in user credits");
            var user = _context.Users.FirstOrDefault(u => u.SupabaseUserId == supabaseUserId);
            if (user == null)
            {
                return NotFound(new { message = "User not found." });
            }

            return Ok(new { credits = user.Credits });
        }

        [Authorize]
        [HttpGet("supabase/{supabaseUserId}/role")]
        public IActionResult GetUserRole(string supabaseUserId)
        {
            var user = _context.Users.FirstOrDefault(u => u.SupabaseUserId == supabaseUserId);
            if (user == null)
            {
                return NotFound(new { message = "User not found." });
            }

            return Ok(new { role = user.Role });
        }

        [Authorize]
        [HttpGet("supabase/{supabaseUserId}")]
        public IActionResult GetUserId(string supabaseUserId)
        {
            var user = _context.Users.FirstOrDefault(u => u.SupabaseUserId == supabaseUserId);
            if (user == null)
            {
                return NotFound(new { message = "User not found." });
            }

            return Ok(new { id = user.Id });
        }

        [HttpGet("test")]
        public IActionResult TestRoute()
        {
            return Ok("UsersController is working!");
        }


        [Authorize]
        [HttpGet("test-auth")]
        public IActionResult TestAuth()
        {
            return Ok("You are authenticated!");
        }

        [Authorize]
        [HttpGet("test-role")]
        public IActionResult TestRole()
        {
            var userRole = User.Claims.FirstOrDefault(c => c.Type == "user_metadata")?.Value;

            if (userRole != null && userRole.Contains("Buyer"))
            {
                return Ok("You are authenticated as a Buyer!");
            }
            else if (userRole != null && userRole.Contains("Seller"))
            {
                return Ok("You are authenticated as a Seller!");
            }

            return Forbid("You are not authorized to access this endpoint.");
        }

    }
}
