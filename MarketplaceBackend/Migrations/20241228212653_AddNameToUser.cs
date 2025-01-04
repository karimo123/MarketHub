using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MarketplaceBackend.Migrations
{
    /// <inheritdoc />
    public partial class AddNameToUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "PasswordHash",
                table: "Users",
                newName: "SupabaseUserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "SupabaseUserId",
                table: "Users",
                newName: "PasswordHash");
        }
    }
}
