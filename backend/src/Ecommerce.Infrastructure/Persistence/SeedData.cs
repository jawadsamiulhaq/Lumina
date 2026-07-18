namespace Ecommerce.Infrastructure.Persistence;

/// <summary>Static sample catalog used to seed a fresh database.</summary>
internal static class SeedData
{
    public static readonly string[] Categories =
    {
        "Electronics",
        "Apparel",
        "Home & Kitchen",
        "Sports & Outdoors",
        "Beauty & Personal Care",
        "Toys & Games"
    };

    // (Name, Category, PriceInCents, Stock, Description, Featured, ImageKeyword)
    // ImageKeyword drives real, content-relevant stock photos (see DbSeeder.UnsplashPhotoIdsByKeyword) —
    // each keyword must have an entry in that map.
    public static readonly (string Name, string Category, int Price, int Stock, string Description, bool Featured, string ImageKeyword)[] Products =
    {
        ("Aurora Wireless Headphones", "Electronics", 19900, 40, "Immersive over-ear headphones with adaptive noise cancellation, 40-hour battery life, and plush memory-foam ear cups for all-day comfort.", true, "headphones"),
        ("Nimbus 14 Ultrabook", "Electronics", 129900, 15, "A featherlight 14-inch laptop with an edge-to-edge display, all-day battery, and a whisper-quiet fanless design for creators on the move.", true, "laptop"),
        ("Pulse Smartwatch Series 5", "Electronics", 34900, 60, "Track workouts, heart rate, and sleep with a vivid always-on AMOLED display and a five-day battery. Water resistant to 50m.", true, "smartwatch"),
        ("Echo Mini Bluetooth Speaker", "Electronics", 7900, 120, "Pocket-sized speaker with room-filling 360° sound, deep bass, and a rugged splash-proof shell for adventures anywhere.", false, "speaker"),
        ("Vertex 4K Action Camera", "Electronics", 24900, 30, "Capture cinematic 4K60 footage with built-in stabilization, a waterproof body, and voice control for hands-free recording.", false, "actioncamera"),

        ("Everyday Merino Crewneck", "Apparel", 8900, 80, "A breathable, temperature-regulating merino wool sweater that layers effortlessly from office to weekend.", true, "sweater"),
        ("Trailblazer Rain Jacket", "Apparel", 14900, 45, "A packable, fully seam-sealed waterproof shell with pit-zip ventilation and a helmet-compatible hood.", false, "rainjacket"),
        ("Classic Denim Jacket", "Apparel", 9900, 70, "A timeless mid-wash denim jacket with a tailored fit, antiqued hardware, and durable triple-stitched seams.", false, "jacket"),
        ("Cloudstep Running Shoes", "Apparel", 12900, 55, "Responsive foam cushioning meets a breathable engineered-knit upper for a smooth, locked-in ride mile after mile.", true, "sneakers"),
        ("Heritage Leather Belt", "Apparel", 5900, 100, "Full-grain vegetable-tanned leather belt with a solid brass buckle that ages beautifully with everyday wear.", false, "belt"),

        ("Barista Pro Espresso Machine", "Home & Kitchen", 44900, 25, "Cafe-quality espresso at home with a precision PID temperature control, built-in grinder, and steam wand for silky microfoam.", true, "espressomachine"),
        ("ChefEdge 8-inch Knife", "Home & Kitchen", 8900, 90, "A precision-forged high-carbon steel chef's knife, hand-honed to a 15° edge and balanced for effortless control.", false, "knife"),
        ("Nordic Cast Iron Dutch Oven", "Home & Kitchen", 15900, 40, "Enameled 6-quart cast iron pot that goes from stovetop to oven, retaining heat for perfect braises and fresh-baked bread.", false, "dutchoven"),
        ("Lumen Smart Table Lamp", "Home & Kitchen", 6900, 65, "Tunable white-to-warm LED lamp with touch dimming and a wireless charging base for a clutter-free desk.", true, "lamp"),
        ("PureMist Ultrasonic Humidifier", "Home & Kitchen", 7900, 50, "Whisper-quiet 4L humidifier with adjustable mist, auto shut-off, and an optional aroma diffuser for cozy rooms.", false, "humidifiers"),

        ("Summit 45L Hiking Backpack", "Sports & Outdoors", 13900, 35, "A ventilated-back trekking pack with adjustable torso, rain cover, and smart compartments for multi-day adventures.", true, "backpack"),
        ("FlowState Yoga Mat", "Sports & Outdoors", 4900, 110, "Extra-thick, non-slip eco-TPE mat with alignment guides and a cushioned cork surface that grips as you sweat.", false, "yoga"),
        ("Torque Adjustable Dumbbell", "Sports & Outdoors", 24900, 28, "Swap from 5 to 52 lbs with a single dial, replacing 15 sets of weights and reclaiming your floor space.", true, "dumbbell"),
        ("Glide Carbon Trekking Poles", "Sports & Outdoors", 8900, 48, "Featherlight carbon-fiber poles with quick-lock adjustment and cork grips that soak up trail vibration.", false, "trekkingpole"),
        ("HydroFlow Insulated Bottle", "Sports & Outdoors", 3900, 150, "Double-wall vacuum bottle keeps drinks cold for 24 hours or hot for 12, with a leakproof cap built for the trail.", false, "waterbottle"),

        ("Silk Glow Vitamin C Serum", "Beauty & Personal Care", 3900, 70, "A lightweight brightening serum with 15% vitamin C and hyaluronic acid that fades dullness for a visible, healthy glow.", true, "serum"),
        ("Botanical Repair Hand Cream", "Beauty & Personal Care", 1900, 120, "Fast-absorbing, non-greasy hand cream with shea butter and aloe that soothes and softens even the driest skin.", false, "handcream"),
        ("Charcoal Detox Clay Mask", "Beauty & Personal Care", 2400, 90, "A purifying clay mask with activated charcoal that draws out impurities and refines pores in ten minutes.", false, "clay"),
        ("Midnight Bloom Eau de Parfum", "Beauty & Personal Care", 6900, 45, "A warm floral fragrance with notes of jasmine, amber, and vanilla that lingers gracefully from day to night.", true, "perfume"),

        ("Starlight Building Blocks 250pc", "Toys & Games", 4900, 60, "A 250-piece creative construction set with a build guide and storage tub that sparks hours of open-ended play.", true, "buildingblocks"),
        ("Puzzle Quest 1000-Piece", "Toys & Games", 2200, 80, "A vivid 1000-piece jigsaw of a mountain village, printed on sturdy linen-finish board that resists glare.", false, "puzzle"),
        ("Rally Rush RC Car", "Toys & Games", 5900, 40, "A 2.4GHz remote-control rally car with all-terrain grip tires and a 20-minute rechargeable battery.", false, "rccar")
    };

    // Products with option axes (Size, Color…). The seeder generates every combination as a variant.
    public static readonly VariantProductSeed[] VariantProducts =
    {
        new("Horizon Organic Tee", "Apparel", 2900,
            "A breathable 100% organic-cotton tee with a relaxed fit and a garment-washed finish that only gets softer.",
            true, "tshirt",
            new[]
            {
                ("Size", new[] { "XS", "S", "M", "L", "XL" }),
                ("Color", new[] { "Black", "White", "Sage", "Navy" }),
            }),
        new("Trekker Zip Hoodie", "Apparel", 6900,
            "A midweight brushed-fleece hoodie with a full-length zip, thumb-hole cuffs, and a media pocket.",
            false, "hoodie",
            new[]
            {
                ("Size", new[] { "S", "M", "L", "XL" }),
                ("Color", new[] { "Charcoal", "Forest", "Rust" }),
            }),
        new("Apex Trail Runner", "Sports & Outdoors", 11900,
            "A grippy, cushioned trail-running shoe with a rock plate and a breathable ripstop upper for technical terrain.",
            true, "sneakers",
            new[]
            {
                ("Size", new[] { "8", "9", "10", "11", "12" }),
                ("Color", new[] { "Volt", "Slate" }),
            }),
        new("Cascade Insulated Tumbler", "Home & Kitchen", 3400,
            "A vacuum-insulated stainless tumbler with a spill-resistant lid that keeps drinks cold for 18 hours.",
            false, "tumbler",
            new[]
            {
                ("Size", new[] { "12oz", "20oz", "32oz" }),
                ("Color", new[] { "Steel", "Blush", "Midnight" }),
            }),
    };
}

/// <summary>A product that carries option axes; the seeder expands the options into concrete variants.</summary>
internal record VariantProductSeed(
    string Name,
    string Category,
    int Price,
    string Description,
    bool Featured,
    string ImageKeyword,
    (string Name, string[] Values)[] Options);
