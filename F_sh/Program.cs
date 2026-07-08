using System.Text.Json;
using Microsoft.EntityFrameworkCore;

// Admin creds
const string ADMIN_LOGIN = "admin";
const string ADMIN_PASS = "admin123";

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddRouting();
builder.Services.AddDbContext<AppDbContext>(options => options.UseSqlite("Data Source=flowers.db"));
var app = builder.Build();

app.UseDefaultFiles();
app.UseStaticFiles();

// Ensure DB created and seed minimal data
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
    
    // Seed admin if not exists
    if (!db.Admins.Any())
    {
        db.Admins.Add(new AdminEntity { Email = "admin@flowershop.local", Password = ADMIN_PASS });
        db.SaveChanges();
    }
    
    // Seed clients if not exists
    if (!db.Clients.Any())
    {
        db.Clients.Add(new ClientEntity { Name = "ivan@example.com", Email = "ivan@example.com", Password = "pass123" });
        db.Clients.Add(new ClientEntity { Name = "maria@example.com", Email = "maria@example.com", Password = "pass456" });
        db.SaveChanges();
    }
    
    if (!db.Shops.Any())
    {
        var shop = new ShopEntity { Name = "Seed Shop", Login = "seller1", Password = "pass1" };
        db.Shops.Add(shop);
        db.Flowers.Add(new FlowerEntity { SellerId = shop.Id, Name = "Роза", Description = "Красная роза", Price = 9.99m, ImageUrl = "https://via.placeholder.com/150" });
        db.SaveChanges();
    }
}

app.MapGet("/api/flowers", async (AppDbContext db) =>
{
    var list = await db.Flowers.Select(f => new { f.Id, f.SellerId, f.Name, f.Description, f.Price, f.ImageUrl, f.Type, f.Stock }).ToListAsync();
    return Results.Json(list);
});

app.MapGet("/api/flowers/seller/{sellerId}", async (string sellerId, AppDbContext db) =>
{
    var list = await db.Flowers.Where(f => f.SellerId == sellerId).Select(f => new { f.Id, f.SellerId, f.Name, f.Description, f.Price, f.ImageUrl, f.Type, f.Stock }).ToListAsync();
    return Results.Json(list);
});

app.MapPost("/api/flowers", async (HttpContext ctx, AppDbContext db) =>
{
    var body = await JsonSerializer.DeserializeAsync<JsonElement>(ctx.Request.Body);
    if (body.ValueKind == JsonValueKind.Undefined) return Results.BadRequest();
    var login = body.GetProperty("login").GetString();
    var password = body.GetProperty("password").GetString();
    if (!string.IsNullOrEmpty(login) && login.Contains("@")) login = login.Split('@')[0];
    var name = body.GetProperty("name").GetString();
    var desc = body.GetProperty("description").GetString();
    var price = body.GetProperty("price").GetDecimal();
    var image = body.GetProperty("imageUrl").GetString();
    var type = body.TryGetProperty("type", out var t) ? t.GetString() ?? "bouquet" : "bouquet";
    var stock = body.TryGetProperty("stock", out var s) ? s.GetInt32() : 0;

    var shop = await db.Shops.FirstOrDefaultAsync(s => s.Login == login && s.Password == password);
    if (shop is null) return Results.Unauthorized();
    var flower = new FlowerEntity { SellerId = shop.Id, Name = name ?? string.Empty, Description = desc ?? string.Empty, Price = price, ImageUrl = image ?? string.Empty, Type = type, Stock = stock };
    db.Flowers.Add(flower);
    await db.SaveChangesAsync();
    var dto = new { flower.Id, flower.SellerId, flower.Name, flower.Description, flower.Price, flower.ImageUrl, flower.Type, flower.Stock };
    return Results.Ok(dto);
});

app.MapDelete("/api/flowers/{id}", async (string id, HttpRequest req, AppDbContext db) =>
{
    var login = req.Query["login"].ToString();
    var password = req.Query["password"].ToString();
    if (!string.IsNullOrEmpty(login) && login.Contains("@")) login = login.Split('@')[0];
    var shop = await db.Shops.FirstOrDefaultAsync(s => s.Login == login && s.Password == password);
    if (shop is null) return Results.Unauthorized();
    var flower = await db.Flowers.FirstOrDefaultAsync(f => f.Id == id && f.SellerId == shop.Id);
    if (flower is null) return Results.NotFound();
    db.Flowers.Remove(flower);
    await db.SaveChangesAsync();
    return Results.Ok();
});

app.MapPut("/api/flowers/{id}", async (string id, HttpRequest req, AppDbContext db) =>
{
    var body = await JsonSerializer.DeserializeAsync<JsonElement>(req.Body);
    var login = body.GetProperty("login").GetString();
    var password = body.GetProperty("password").GetString();
    if (!string.IsNullOrEmpty(login) && login.Contains("@")) login = login.Split('@')[0];
    var shop = await db.Shops.FirstOrDefaultAsync(s => s.Login == login && s.Password == password);
    if (shop is null) return Results.Unauthorized();
    var flower = await db.Flowers.FirstOrDefaultAsync(f => f.Id == id && f.SellerId == shop.Id);
    if (flower is null) return Results.NotFound();

    var name = body.TryGetProperty("name", out var _n) ? _n.GetString() : null;
    var desc = body.TryGetProperty("description", out var _d) ? _d.GetString() : null;
    var price = body.TryGetProperty("price", out var _p) ? _p.GetDecimal() : flower.Price;
    var image = body.TryGetProperty("imageUrl", out var _i) ? _i.GetString() : null;
    var type = body.TryGetProperty("type", out var _t) ? _t.GetString() : flower.Type;
    var stock = body.TryGetProperty("stock", out var _s) ? _s.GetInt32() : flower.Stock;

    flower.Name = name ?? flower.Name;
    flower.Description = desc ?? flower.Description;
    flower.Price = price;
    flower.ImageUrl = image ?? flower.ImageUrl;
    flower.Type = type ?? flower.Type;
    flower.Stock = stock;
    await db.SaveChangesAsync();
    var dto = new { flower.Id, flower.SellerId, flower.Name, flower.Description, flower.Price, flower.ImageUrl, flower.Type, flower.Stock };
    return Results.Ok(dto);
});

app.MapPost("/api/orders/bouquet", async (HttpContext ctx, AppDbContext db) =>
{
    var body = await JsonSerializer.DeserializeAsync<JsonElement>(ctx.Request.Body);
    if (body.ValueKind == JsonValueKind.Undefined) return Results.BadRequest();
    var clientName = body.GetProperty("clientName").GetString();
    var address = body.GetProperty("address").GetString();
    var itemsElem = body.GetProperty("items");
    var items = new List<OrderItemEntity>();
    foreach (var it in itemsElem.EnumerateArray())
    {
        var pid = it.GetProperty("productId").GetString();
        var qty = it.GetProperty("quantity").GetInt32();
        var prod = await db.Flowers.FirstOrDefaultAsync(f => f.Id == pid);
        if (prod is null) return Results.NotFound($"Product {pid} not found");
        if (prod.Type == "single")
        {
            if (prod.Stock < qty) return Results.BadRequest($"Not enough stock for {prod.Name}");
            prod.Stock -= qty;
        }
        items.Add(new OrderItemEntity { ProductId = pid ?? string.Empty, SellerId = prod.SellerId, Quantity = qty, Price = prod.Price });
    }
    if (body.TryGetProperty("paperId", out var ppp) && ppp.ValueKind != JsonValueKind.Null)
    {
        var paperId = ppp.GetString();
        if (!string.IsNullOrEmpty(paperId))
        {
            var paper = await db.Flowers.FirstOrDefaultAsync(f => f.Id == paperId && f.Type == "paper");
            if (paper == null) return Results.NotFound("Paper not found");
            items.Add(new OrderItemEntity { ProductId = paper.Id, SellerId = paper.SellerId, Quantity = 1, Price = paper.Price });
        }
    }
    var order = new OrderEntity { FlowerId = null, SellerId = null, ClientName = clientName ?? string.Empty, Address = address ?? string.Empty, Quantity = 0, Items = items };
    db.Orders.Add(order);
    await db.SaveChangesAsync();
    return Results.Ok(order);
});

app.MapPost("/api/applications", async (HttpContext ctx, AppDbContext db) =>
{
    var body = await JsonSerializer.DeserializeAsync<JsonElement>(ctx.Request.Body);
    var name = body.GetProperty("name").GetString();
    var email = body.GetProperty("email").GetString();
    var password = body.GetProperty("password").GetString();
    var appn = new ShopApplicationEntity { Name = name ?? string.Empty, Email = email ?? string.Empty, Password = password ?? string.Empty };
    db.Applications.Add(appn);
    await db.SaveChangesAsync();
    return Results.Ok(appn);
});

app.MapGet("/api/applications", async (HttpRequest req, AppDbContext db) =>
{
    var login = req.Query["login"].ToString();
    var password = req.Query["password"].ToString();
    if (login != ADMIN_LOGIN || password != ADMIN_PASS) return Results.Unauthorized();
    return Results.Json(await db.Applications.ToListAsync());
});

app.MapPut("/api/applications/{id}/approve", async (string id, HttpRequest req, AppDbContext db) =>
{
    var login = req.Query["login"].ToString();
    var password = req.Query["password"].ToString();
    if (login != ADMIN_LOGIN || password != ADMIN_PASS) return Results.Unauthorized();
    var appn = await db.Applications.FirstOrDefaultAsync(a => a.Id == id);
    if (appn is null) return Results.NotFound();
    db.Applications.Remove(appn);
    var shop = new ShopEntity { Name = appn.Name, Login = appn.Email.Split('@')[0], Password = appn.Password };
    db.Shops.Add(shop);
    await db.SaveChangesAsync();
    return Results.Ok(shop);
});

app.MapPut("/api/applications/{id}/reject", async (string id, HttpRequest req, AppDbContext db) =>
{
    var login = req.Query["login"].ToString();
    var password = req.Query["password"].ToString();
    if (login != ADMIN_LOGIN || password != ADMIN_PASS) return Results.Unauthorized();
    var appn = await db.Applications.FirstOrDefaultAsync(a => a.Id == id);
    if (appn is null) return Results.NotFound();
    db.Applications.Remove(appn);
    await db.SaveChangesAsync();
    return Results.Ok();
});

app.MapGet("/api/shops", async (HttpRequest req, AppDbContext db) =>
{
    var login = req.Query["login"].ToString();
    var password = req.Query["password"].ToString();
    if (login != ADMIN_LOGIN || password != ADMIN_PASS) return Results.Unauthorized();
    return Results.Json(await db.Shops.ToListAsync());
});

app.MapDelete("/api/shops/{id}", async (string id, HttpRequest req, AppDbContext db) =>
{
    var login = req.Query["login"].ToString();
    var password = req.Query["password"].ToString();
    if (login != ADMIN_LOGIN || password != ADMIN_PASS) return Results.Unauthorized();
    var shop = await db.Shops.FirstOrDefaultAsync(s => s.Id == id);
    if (shop is null) return Results.NotFound();
    db.Shops.Remove(shop);
    await db.SaveChangesAsync();
    return Results.Ok();
});

app.MapPost("/api/seller/login", async (HttpContext ctx, AppDbContext db) =>
{
    var body = await JsonSerializer.DeserializeAsync<JsonElement>(ctx.Request.Body);
    var login = body.GetProperty("login").GetString();
    var password = body.GetProperty("password").GetString();
    if (login is null || password is null) return Results.BadRequest();
    if (login.Contains("@")) login = login.Split('@')[0];
    var shop = await db.Shops.FirstOrDefaultAsync(s => s.Login == login && s.Password == password);
    if (shop is null) return Results.Unauthorized();
    return Results.Ok(shop);
});

app.MapPost("/api/admin/login", async (HttpContext ctx, AppDbContext db) =>
{
    var body = await JsonSerializer.DeserializeAsync<JsonElement>(ctx.Request.Body);
    var email = body.GetProperty("email").GetString();
    var password = body.GetProperty("password").GetString();
    if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password)) return Results.BadRequest();
    
    // Check hardcoded admin first
    if (email == "admin@flowershop.local" && password == ADMIN_PASS)
    {
        return Results.Ok(new { id = "admin-1", email = email });
    }
    
    // Check database admins
    var admin = await db.Admins.FirstOrDefaultAsync(a => a.Email == email && a.Password == password);
    if (admin is null) return Results.Unauthorized();
    return Results.Ok(new { id = admin.Id, email = admin.Email });
});

app.MapPost("/api/client/register", async (HttpContext ctx, AppDbContext db) =>
{
    var body = await JsonSerializer.DeserializeAsync<JsonElement>(ctx.Request.Body);
    var email = body.GetProperty("email").GetString();
    var password = body.GetProperty("password").GetString();

    if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password)) 
        return Results.BadRequest("Email and password required");

    // Check if client with same email already exists
    var existing = await db.Clients.FirstOrDefaultAsync(c => c.Email == email);
    if (existing is not null) 
        return Results.BadRequest("Client with this email already exists");

    var client = new ClientEntity { Name = email, Email = email, Password = password };
    db.Clients.Add(client);
    await db.SaveChangesAsync();
    return Results.Ok(new { id = client.Id, email = client.Email });
});

app.MapPost("/api/client/login", async (HttpContext ctx, AppDbContext db) =>
{
    var body = await JsonSerializer.DeserializeAsync<JsonElement>(ctx.Request.Body);
    var email = body.GetProperty("email").GetString();
    var password = body.GetProperty("password").GetString();

    if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password)) 
        return Results.BadRequest("Email and password required");

    var client = await db.Clients.FirstOrDefaultAsync(c => c.Email == email && c.Password == password);
    if (client is null) 
        return Results.Unauthorized();

    return Results.Ok(new { id = client.Id, email = client.Email });
});

// Create shop directly (admin only) - public registration should use /api/applications
app.MapPost("/api/shops", async (HttpContext ctx, AppDbContext db) =>
{
    // require admin credentials to create a shop directly
    var q = ctx.Request.Query;
    var adminLogin = q["login"].ToString();
    var adminPass = q["password"].ToString();

    var body = await JsonSerializer.DeserializeAsync<JsonElement>(ctx.Request.Body);
    // If admin credentials are present and valid — create shop directly.
    if (adminLogin == ADMIN_LOGIN && adminPass == ADMIN_PASS)
    {
        var name = body.GetProperty("name").GetString();
        var email = body.GetProperty("email").GetString();
        var password = body.GetProperty("password").GetString();
        if (string.IsNullOrWhiteSpace(name) || string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password)) return Results.BadRequest();
        var login = email.Split('@')[0];
        var shop = new ShopEntity { Name = name ?? string.Empty, Login = login, Password = password ?? string.Empty };
        db.Shops.Add(shop);
        await db.SaveChangesAsync();
        return Results.Ok(shop);
    }

    // Back-compat: some older frontends post to /api/shops to register — treat as application
    var appName = body.TryGetProperty("name", out var _n) ? _n.GetString() : null;
    var appEmail = body.TryGetProperty("email", out var _e) ? _e.GetString() : null;
    var appPassword = body.TryGetProperty("password", out var _p) ? _p.GetString() : null;
    if (string.IsNullOrWhiteSpace(appName) || string.IsNullOrWhiteSpace(appEmail) || string.IsNullOrWhiteSpace(appPassword))
    {
        return Results.BadRequest();
    }
    var application = new ShopApplicationEntity { Name = appName, Email = appEmail, Password = appPassword };
    db.Applications.Add(application);
    await db.SaveChangesAsync();
    return Results.Ok(application);
});

app.MapGet("/api/admins", async (HttpRequest req, AppDbContext db) =>
{
    var login = req.Query["login"].ToString();
    var password = req.Query["password"].ToString();
    if (login != ADMIN_LOGIN || password != ADMIN_PASS) return Results.Unauthorized();
    var adminInfo = new {
        admin = new { login = ADMIN_LOGIN, password = ADMIN_PASS },
        shops = await db.Shops.ToListAsync(),
        applications = await db.Applications.ToListAsync()
    };
    return Results.Json(adminInfo);
});

app.MapPost("/api/orders", async (HttpContext ctx, AppDbContext db) =>
{
    var body = await JsonSerializer.DeserializeAsync<JsonElement>(ctx.Request.Body);
    var flowerId = body.GetProperty("flowerId").GetString();
    var clientName = body.GetProperty("clientName").GetString();
    var address = body.GetProperty("address").GetString();
    var qty = body.GetProperty("quantity").GetInt32();
    var flower = await db.Flowers.FirstOrDefaultAsync(f => f.Id == flowerId);
    if (flower is null) return Results.NotFound();
    var order = new OrderEntity { FlowerId = flowerId, SellerId = flower.SellerId, ClientName = clientName ?? string.Empty, Address = address ?? string.Empty, Quantity = qty };
    db.Orders.Add(order);
    await db.SaveChangesAsync();
    return Results.Ok(order);
});

app.MapPost("/api/orders/seller", async (HttpContext ctx, AppDbContext db) =>
{
    var body = await JsonSerializer.DeserializeAsync<JsonElement>(ctx.Request.Body);
    var login = body.GetProperty("login").GetString();
    var password = body.GetProperty("password").GetString();
    var shop = await db.Shops.FirstOrDefaultAsync(s => s.Login == login && s.Password == password);
    if (shop is null) return Results.Unauthorized();
    var result = new List<object>();
    var orders = await db.Orders.Include(o => o.Items).ToListAsync();
    foreach (var o in orders)
    {
        var items = o.Items?.Where(i => i.SellerId == shop.Id).ToList();
        if (items != null && items.Any())
        {
            result.Add(new { orderId = o.Id, clientName = o.ClientName, address = o.Address, items = items });
        }
        else if (!string.IsNullOrEmpty(o.FlowerId))
        {
            if (o.SellerId == shop.Id) result.Add(o);
        }
    }
    return Results.Ok(result);
});

app.MapGet("/health", () => "ok");

app.MapGet("/api/debug", async (AppDbContext db) => {
    var shops = await db.Shops.Select(s => new { s.Id, s.Name, s.Login }).ToListAsync();
    var applications = await db.Applications.Select(a => new { a.Id, a.Name, a.Email, a.Status }).ToListAsync();
    var flowers = await db.Flowers.Select(f => new { f.Id, f.SellerId, f.Name, f.Description, f.Price, f.ImageUrl, f.Type, f.Stock }).ToListAsync();
    var orders = await db.Orders.Include(o => o.Items).Select(o => new {
        o.Id,
        o.FlowerId,
        o.SellerId,
        o.ClientName,
        o.Address,
        o.Quantity,
        Items = o.Items.Select(i => new { i.ProductId, i.SellerId, i.Quantity, i.Price })
    }).ToListAsync();
    return Results.Json(new { ok = true, shops, applications, flowers, orders });
});

app.Run("http://0.0.0.0:5000");
