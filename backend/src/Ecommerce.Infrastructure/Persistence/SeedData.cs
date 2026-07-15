namespace Ecommerce.Infrastructure.Persistence;

/// <summary>Static sample catalog used to seed a fresh database.</summary>
internal static class SeedData
{
    public static readonly string[] Categories =
    {
        "Electronics",
        "Apparel",
        "Home & Kitchen",
        "Sports & Outdoors"
    };

    // (Name, Category, PriceInCents, Stock, Description, Featured)
    public static readonly (string Name, string Category, int Price, int Stock, string Description, bool Featured)[] Products =
    {
        ("Aurora Wireless Headphones", "Electronics", 19900, 40, "Immersive over-ear headphones with adaptive noise cancellation, 40-hour battery life, and plush memory-foam ear cups for all-day comfort.", true),
        ("Nimbus 14 Ultrabook", "Electronics", 129900, 15, "A featherlight 14-inch laptop with an edge-to-edge display, all-day battery, and a whisper-quiet fanless design for creators on the move.", true),
        ("Pulse Smartwatch Series 5", "Electronics", 34900, 60, "Track workouts, heart rate, and sleep with a vivid always-on AMOLED display and a five-day battery. Water resistant to 50m.", true),
        ("Echo Mini Bluetooth Speaker", "Electronics", 7900, 120, "Pocket-sized speaker with room-filling 360° sound, deep bass, and a rugged splash-proof shell for adventures anywhere.", false),
        ("Vertex 4K Action Camera", "Electronics", 24900, 30, "Capture cinematic 4K60 footage with built-in stabilization, a waterproof body, and voice control for hands-free recording.", false),

        ("Everyday Merino Crewneck", "Apparel", 8900, 80, "A breathable, temperature-regulating merino wool sweater that layers effortlessly from office to weekend.", true),
        ("Trailblazer Rain Jacket", "Apparel", 14900, 45, "A packable, fully seam-sealed waterproof shell with pit-zip ventilation and a helmet-compatible hood.", false),
        ("Classic Denim Jacket", "Apparel", 9900, 70, "A timeless mid-wash denim jacket with a tailored fit, antiqued hardware, and durable triple-stitched seams.", false),
        ("Cloudstep Running Shoes", "Apparel", 12900, 55, "Responsive foam cushioning meets a breathable engineered-knit upper for a smooth, locked-in ride mile after mile.", true),
        ("Heritage Leather Belt", "Apparel", 5900, 100, "Full-grain vegetable-tanned leather belt with a solid brass buckle that ages beautifully with everyday wear.", false),

        ("Barista Pro Espresso Machine", "Home & Kitchen", 44900, 25, "Cafe-quality espresso at home with a precision PID temperature control, built-in grinder, and steam wand for silky microfoam.", true),
        ("ChefEdge 8-inch Knife", "Home & Kitchen", 8900, 90, "A precision-forged high-carbon steel chef's knife, hand-honed to a 15° edge and balanced for effortless control.", false),
        ("Nordic Cast Iron Dutch Oven", "Home & Kitchen", 15900, 40, "Enameled 6-quart cast iron pot that goes from stovetop to oven, retaining heat for perfect braises and fresh-baked bread.", false),
        ("Lumen Smart Table Lamp", "Home & Kitchen", 6900, 65, "Tunable white-to-warm LED lamp with touch dimming and a wireless charging base for a clutter-free desk.", true),
        ("PureMist Ultrasonic Humidifier", "Home & Kitchen", 7900, 50, "Whisper-quiet 4L humidifier with adjustable mist, auto shut-off, and an optional aroma diffuser for cozy rooms.", false),

        ("Summit 45L Hiking Backpack", "Sports & Outdoors", 13900, 35, "A ventilated-back trekking pack with adjustable torso, rain cover, and smart compartments for multi-day adventures.", true),
        ("FlowState Yoga Mat", "Sports & Outdoors", 4900, 110, "Extra-thick, non-slip eco-TPE mat with alignment guides and a cushioned cork surface that grips as you sweat.", false),
        ("Torque Adjustable Dumbbell", "Sports & Outdoors", 24900, 28, "Swap from 5 to 52 lbs with a single dial, replacing 15 sets of weights and reclaiming your floor space.", true),
        ("Glide Carbon Trekking Poles", "Sports & Outdoors", 8900, 48, "Featherlight carbon-fiber poles with quick-lock adjustment and cork grips that soak up trail vibration.", false),
        ("HydroFlow Insulated Bottle", "Sports & Outdoors", 3900, 150, "Double-wall vacuum bottle keeps drinks cold for 24 hours or hot for 12, with a leakproof cap built for the trail.", false)
    };
}
