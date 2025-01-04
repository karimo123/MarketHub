using Microsoft.AspNetCore.Mvc;
using MarketplaceBackend.Data;
using Microsoft.AspNetCore.Authorization;

namespace MarketplaceBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductsController : ControllerBase
    {
        private readonly MarketplaceContext _context;

        public ProductsController(MarketplaceContext context)
        {
            _context = context;
        }

        // GET: api/products
        [HttpGet]
        public IActionResult GetProducts(bool? isActive = null)
        {
            var products = _context.Products.AsQueryable();

            if (isActive.HasValue)
            {
                products = products.Where(p => p.IsActive == isActive.Value);
            }

            return Ok(products.ToList());
        }

        // POST: api/products
        [Authorize]
        [HttpPost]
        public IActionResult CreateProduct(Product product)
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

            var seller = _context.Users.FirstOrDefault(u => u.SupabaseUserId == supabaseUserId && u.Role == "Seller");
            if (seller == null)
            {
                return Unauthorized(new { message = "Only sellers can create products." });
            }

            if (string.IsNullOrWhiteSpace(product.Title))
                return BadRequest(new { message = "Title is required." });

            if (product.Price <= 0)
                return BadRequest(new { message = "Price must be greater than zero." });

            product.SellerId = seller.Id;
            product.CreatedAt = DateTime.UtcNow;
            product.UpdatedAt = DateTime.UtcNow;

            _context.Products.Add(product);
            _context.SaveChanges();

            return Ok(new { message = "Product created successfully.", product });
        }


        // PUT: api/products/{id}
        [Authorize]
        [HttpPut("{id}")]
        public IActionResult UpdateProduct(int id, Product updatedProduct)
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

            var seller = _context.Users.FirstOrDefault(u => u.SupabaseUserId == supabaseUserId && u.Role == "Seller");
            if (seller == null)
            {
                return Unauthorized(new { message = "Only sellers can update products." });
            }

            var existingProduct = _context.Products.Find(id);
            if (existingProduct == null)
            {
                return NotFound(new { message = "Product not found." });
            }

            if (existingProduct.SellerId != seller.Id)
            {
                return Unauthorized(new { message = "You are not authorized to update this product." });
            }

            existingProduct.Title = updatedProduct.Title;
            existingProduct.Price = updatedProduct.Price;
            existingProduct.Description = updatedProduct.Description;
            existingProduct.Category = updatedProduct.Category;
            existingProduct.ImageUrl = updatedProduct.ImageUrl;
            existingProduct.Stock = updatedProduct.Stock;
            existingProduct.IsActive = updatedProduct.IsActive;
            existingProduct.UpdatedAt = DateTime.UtcNow;

            _context.SaveChanges();

            return Ok(new { message = "Product updated successfully.", product = existingProduct });
        }

        [Authorize]
        [HttpPost("{productId}/purchase")]
        public IActionResult PurchaseProduct(int productId)
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

            var buyerSupabaseId = subProperty.GetString();

            if (string.IsNullOrEmpty(buyerSupabaseId))
            {
                return Unauthorized(new { message = "User metadata is missing." });
            }

            var buyer = _context.Users.FirstOrDefault(u => u.SupabaseUserId == buyerSupabaseId);
            if (buyer == null)
            {
                return Unauthorized(new { message = "Buyer not found." });
            }

            var product = _context.Products.FirstOrDefault(p => p.Id == productId);
            if (product == null)
            {
                return NotFound(new { message = "Product not found." });
            }

            if (buyer.Credits < product.Price)
            {
                return BadRequest(new { message = "Insufficient credits." });
            }

            if (product.Stock <= 0)
            {
                return BadRequest(new { message = "Product is out of stock." });
            }

            buyer.Credits -= product.Price;

            var seller = _context.Users.FirstOrDefault(u => u.Id == product.SellerId);
            if (seller != null)
            {
                seller.Credits += product.Price;
            }

            product.Stock -= 1;

            var order = new Order
            {
                ProductId = product.Id,
                BuyerId = buyer.Id,
                Quantity = 1,
                TotalPrice = product.Price,
                OrderDate = DateTime.UtcNow
            };

            _context.Orders.Add(order);

            _context.SaveChanges();

            return Ok(new { message = "Purchase successful." });
        }


         // DELETE: api/products/{id}
        [HttpDelete("{id}")]
        public IActionResult DeleteProduct(int id)
        {
            var product = _context.Products.Find(id);
            if (product == null)
            {
                return NotFound(new { message = "Product not found." });
            }

            _context.Products.Remove(product);
            _context.SaveChanges();

            return Ok(new { message = "Product deleted successfully." });
        }

        [Authorize]
        [HttpGet("seller")]
        public IActionResult GetProductsBySeller()
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

            var seller = _context.Users.FirstOrDefault(u => u.SupabaseUserId == supabaseUserId && u.Role == "Seller");
            if (seller == null)
            {
                return Unauthorized(new { message = "Only sellers can access their products." });
            }

            var products = _context.Products.Where(p => p.SellerId == seller.Id).ToList();
            return Ok(products);
        }


        [HttpGet("seller/{sellerId}/products")]
        public IActionResult GetSellerProductsPaginated(int sellerId, int page = 1, int pageSize = 10)
        {
            var products = _context.Products
                .Where(p => p.SellerId == sellerId)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            return Ok(products);
        }

        [HttpGet("filter")]
        public IActionResult FilterProducts([FromQuery] string? category, [FromQuery] decimal? minPrice, [FromQuery] decimal? maxPrice, [FromQuery] string? search)
        {
            var query = _context.Products.AsQueryable();

            if (!string.IsNullOrEmpty(category))
            {
                query = query.Where(p => p.Category.ToLower() == category.ToLower());
            }

            if (minPrice.HasValue)
            {
                query = query.Where(p => p.Price >= minPrice.Value);
            }

            if (maxPrice.HasValue)
            {
                query = query.Where(p => p.Price <= maxPrice.Value);
            }

            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(p => p.Title.ToLower().Contains(search.ToLower()) || 
                                        p.Description.ToLower().Contains(search.ToLower()));
            }

            var filteredProducts = query.ToList();
            return Ok(filteredProducts);
        }

        [HttpGet("sort")]
        public IActionResult SortProducts([FromQuery] string sortBy = "price", [FromQuery] string order = "asc")
        {
            var products = _context.Products.AsQueryable();

            switch (sortBy.ToLower())
            {
                case "price":
                    products = order.ToLower() == "desc" 
                        ? products.OrderByDescending(p => p.Price) 
                        : products.OrderBy(p => p.Price);
                    break;
                case "createddate":
                    products = order.ToLower() == "desc" 
                        ? products.OrderByDescending(p => p.CreatedAt) 
                        : products.OrderBy(p => p.CreatedAt);
                    break;
                default:
                    return BadRequest(new { message = "Invalid sort field. Use 'price' or 'createddate'." });
            }

            return Ok(products.ToList());
        }

        [Authorize]
        [HttpGet("seller/orders")]
        public IActionResult GetSellerOrders()
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

            var seller = _context.Users.FirstOrDefault(u => u.SupabaseUserId == supabaseUserId && u.Role == "Seller");
            if (seller == null)
            {
                return Unauthorized(new { message = "Only sellers can access orders." });
            }

            var orders = _context.Orders
                .Where(o => o.Product.SellerId == seller.Id)
                .Select(o => new
                {
                    o.Id,
                    o.Product.Title,
                    o.Quantity,
                    TotalPrice = o.Quantity * o.Product.Price,
                    BuyerEmail = o.Buyer.Email,
                    OrderDate = o.OrderDate.ToString("o") 
                })
                .ToList();

            return Ok(orders);
        }

        [Authorize]
        [HttpGet("buyer/orders")]
        public IActionResult GetBuyerOrders()
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

            var buyer = _context.Users.FirstOrDefault(u => u.SupabaseUserId == supabaseUserId);
            if (buyer == null)
            {
                return Unauthorized(new { message = "Buyer not found." });
            }

            var orders = _context.Orders
                .Where(o => o.BuyerId == buyer.Id)
                .Join(_context.Products,
                    order => order.ProductId,
                    product => product.Id,
                    (order, product) => new { order, product })
                .Join(_context.Users,
                    combined => combined.product.SellerId,
                    user => user.Id,
                    (combined, seller) => new
                    {
                        combined.order.Id,
                        ProductTitle = combined.product.Title,
                        combined.order.Quantity,
                        TotalPrice = combined.order.Quantity * combined.product.Price,
                        SellerEmail = seller.Email,
                        OrderDate = combined.order.OrderDate.ToString("o")
                    })
                .ToList();

            return Ok(orders);
        }
    }
}
