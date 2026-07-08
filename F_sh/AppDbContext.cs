using Microsoft.EntityFrameworkCore;

public class ShopApplicationEntity
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string Status { get; set; } = "pending";
}

public class ShopEntity
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Name { get; set; } = string.Empty;
    public string Login { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public List<FlowerEntity> Flowers { get; set; } = new();
}

public class FlowerEntity
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string SellerId { get; set; } = string.Empty;
    public ShopEntity? Seller { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public string Type { get; set; } = "bouquet"; // bouquet|single|paper
    public int Stock { get; set; } = 0;
}

public class OrderItemEntity
{
    public int Id { get; set; }
    public string ProductId { get; set; } = string.Empty;
    public string SellerId { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal Price { get; set; }
    public string OrderId { get; set; } = string.Empty;
    public OrderEntity? Order { get; set; }
}

public class OrderEntity
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string? FlowerId { get; set; }
    public string? SellerId { get; set; }
    public string ClientName { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public List<OrderItemEntity> Items { get; set; } = new();
}

public class AdminEntity
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class ClientEntity
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Name { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string Password { get; set; } = string.Empty;
}

public class AppDbContext : DbContext
{
    public DbSet<ShopApplicationEntity> Applications { get; set; } = null!;
    public DbSet<ShopEntity> Shops { get; set; } = null!;
    public DbSet<FlowerEntity> Flowers { get; set; } = null!;
    public DbSet<OrderEntity> Orders { get; set; } = null!;
    public DbSet<OrderItemEntity> OrderItems { get; set; } = null!;
    public DbSet<AdminEntity> Admins { get; set; } = null!;
    public DbSet<ClientEntity> Clients { get; set; } = null!;

    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ShopEntity>().HasKey(s => s.Id);
        modelBuilder.Entity<FlowerEntity>().HasKey(f => f.Id);
        modelBuilder.Entity<ShopEntity>().HasMany(s => s.Flowers).WithOne(f => f.Seller).HasForeignKey(f => f.SellerId).OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<OrderEntity>().HasKey(o => o.Id);
        modelBuilder.Entity<OrderItemEntity>().HasKey(i => i.Id);
        modelBuilder.Entity<OrderEntity>().HasMany(o => o.Items).WithOne(i => i.Order).HasForeignKey(i => i.OrderId).OnDelete(DeleteBehavior.Cascade);
        base.OnModelCreating(modelBuilder);
    }
}
