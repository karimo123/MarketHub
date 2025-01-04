# ---- Build Stage ----
    FROM mcr.microsoft.com/dotnet/sdk:6.0 AS build
    WORKDIR /app
    
    # Copy just the .csproj first and restore.
    # This way Docker can cache the restore layer if nothing in .csproj changes.
    COPY MarketplaceBackend.csproj ./
    RUN dotnet restore
    
    # Now copy the rest of the source code
    COPY . ./
    
    # Publish release build
    RUN dotnet publish -c Release -o out
    
    # ---- Runtime Stage ----
    FROM mcr.microsoft.com/dotnet/aspnet:6.0 AS runtime
    WORKDIR /app
    
    # Copy published output from the build stage
    COPY --from=build /app/out ./
    
    # Expose port 80 (optional if your host maps it automatically)
    EXPOSE 80
    
    # Finally, run the app
    ENTRYPOINT ["dotnet", "MarketplaceBackend.dll"]
    