using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MarketplaceBackend.Data;
using System.Linq;

namespace MarketplaceBackend.Controllers
{
       public class AddToCartRequest
        {
            public int ProductId { get; set; }
            public int Quantity { get; set; } = 1;
        }
    [ApiController]
    [Route("api/[controller]")]
    public class CartController : ControllerBase
    {
        private readonly MarketplaceContext _context;

        public CartController(MarketplaceContext context)
        {
            _context = context;
        }

        [Authorize]
        [HttpPost]
        public IActionResult AddToCart([FromBody] AddToCartRequest request)
        {
            var userMetadataClaim = User.Claims.FirstOrDefault(c => c.Type == "user_metadata")?.Value;
            if (string.IsNullOrEmpty(userMetadataClaim))
            {
                return Unauthorized(new { message = "User metadata is missing." });
            }

            var userMetadata = System.Text.Json.JsonDocument.Parse(userMetadataClaim);
            if (!userMetadata.RootElement.TryGetProperty("sub", out var subProperty))
            {
                return Unauthorized(new { message = "User ID (sub) not found in metadata." });
            }

            var supabaseUserId = subProperty.GetString();

            if (string.IsNullOrEmpty(supabaseUserId))
            {
                return Unauthorized(new { message = "Invalid or missing Supabase user ID." });
            }
            var user = _context.Users.FirstOrDefault(u => u.SupabaseUserId == supabaseUserId);
            if (user == null)
            {
                return Unauthorized(new { message = "User not found." });
            }

            Console.WriteLine($"Product ID: {request.ProductId}");
            var product = _context.Products.FirstOrDefault(p => p.Id == request.ProductId);
            if (product == null || product.Stock <= 0)
            {
                return BadRequest(new { message = "Product not available." });
            }
            
            var cartItem = _context.CartItems.FirstOrDefault(c => c.UserId == user.Id && c.ProductId == request.ProductId);
            if (cartItem != null)
            {
                cartItem.Quantity += request.Quantity;
            }
            else
            {
                cartItem = new CartItem
                {
                    UserId = user.Id,
                    ProductId = request.ProductId,
                    Quantity = request.Quantity
                };
                _context.CartItems.Add(cartItem);
            }

            _context.SaveChanges();
            return Ok(new { message = "Product added to cart." });
        }


        [Authorize]
        [HttpGet("{userId}")]
        public IActionResult GetCartItems(int userId)
        {
            var cartItems = _context.CartItems
                .Where(c => c.UserId == userId)
                .Select(c => new
                {
                    c.Id,
                    c.ProductId,
                    c.Quantity,
                    c.Product.Title,
                    c.Product.Price,
                    c.Product.ImageUrl
                })
                .ToList();

            return Ok(cartItems);
        }

        [Authorize]
        [HttpDelete("{cartItemId}")]
        public IActionResult RemoveFromCart(int cartItemId)
        {
            var cartItem = _context.CartItems.FirstOrDefault(c => c.Id == cartItemId);
            if (cartItem == null)
            {
                return NotFound(new { message = "Cart item not found." });
            }

            _context.CartItems.Remove(cartItem);
            _context.SaveChanges();
            return Ok(new { message = "Item removed from cart." });
        }

        [Authorize]
        [HttpPost("checkout")]
        public IActionResult CheckoutCart()
        {
            var userMetadataClaim = User.Claims.FirstOrDefault(c => c.Type == "user_metadata")?.Value;
            if (string.IsNullOrEmpty(userMetadataClaim))
            {
                return Unauthorized(new { message = "User metadata is missing." });
            }

            var userMetadata = System.Text.Json.JsonDocument.Parse(userMetadataClaim);
            if (!userMetadata.RootElement.TryGetProperty("sub", out var subProperty))
            {
                return Unauthorized(new { message = "User ID (sub) not found in metadata." });
            }

            var supabaseUserId = subProperty.GetString();

            if (string.IsNullOrEmpty(supabaseUserId))
            {
                return Unauthorized(new { message = "Invalid or missing Supabase user ID." });
            }

            var user = _context.Users.FirstOrDefault(u => u.SupabaseUserId == supabaseUserId);
            if (user == null)
            {
                return Unauthorized(new { message = "User not found." });
            }

            var cartItems = _context.CartItems.Where(c => c.UserId == user.Id).ToList();

            if (!cartItems.Any())
            {
                return BadRequest(new { message = "Your cart is empty." });
            }

            decimal totalCost = 0;
            var orders = new List<Order>();

            foreach (var cartItem in cartItems)
            {
                var product = _context.Products.FirstOrDefault(p => p.Id == cartItem.ProductId);
                if (product == null || product.Stock < cartItem.Quantity)
                {
                    return BadRequest(new { message = $"Insufficient stock for product: {product?.Title}" });
                }

                totalCost += product.Price * cartItem.Quantity;

                product.Stock -= cartItem.Quantity;

                var seller = _context.Users.FirstOrDefault(u => u.Id == product.SellerId);
                if (seller != null)
                {
                    seller.Credits += product.Price * cartItem.Quantity;
                }

                orders.Add(new Order
                {
                    ProductId = product.Id,
                    BuyerId = user.Id,
                    Quantity = cartItem.Quantity,
                    TotalPrice = product.Price * cartItem.Quantity,
                    OrderDate = DateTime.UtcNow
                });
            }

            if (user.Credits < totalCost)
            {
                return BadRequest(new { message = "Insufficient credits to complete the purchase." });
            }

            user.Credits -= totalCost;

            _context.Orders.AddRange(orders);

            _context.CartItems.RemoveRange(cartItems);

            _context.SaveChanges();

            return Ok(new { message = "Checkout completed successfully.", orders });
        }

        [Authorize]
        [HttpPut("{cartItemId}")]
        public IActionResult UpdateCartQuantity(int cartItemId, [FromBody] int newQuantity)
        {
            var cartItem = _context.CartItems.FirstOrDefault(c => c.Id == cartItemId);
            if (cartItem == null)
            {
                return NotFound(new { message = "Cart item not found." });
            }

            var product = _context.Products.FirstOrDefault(p => p.Id == cartItem.ProductId);
            if (product == null || newQuantity > product.Stock || newQuantity < 1)
            {
                return BadRequest(new { message = "Invalid quantity." });
            }

            cartItem.Quantity = newQuantity;
            _context.SaveChanges();

            return Ok(new { message = "Cart item quantity updated." });
        }
    }
}
