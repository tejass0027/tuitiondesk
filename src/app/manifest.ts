import type { MetadataRoute } from "next";

/**
 * Makes TuitionDesk installable: "Add to Home screen" gives an app icon that
 * opens full-screen (no browser address bar), like an app from the Play Store.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "TuitionDesk",
    short_name: "TuitionDesk",
    description: "Attendance, fees and WhatsApp reminders for your tuition centre.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#4f46e5",
    theme_color: "#4f46e5",
    categories: ["education", "productivity", "business"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    // Long-press the app icon for these
    shortcuts: [
      { name: "Mark attendance", short_name: "Attendance", url: "/attendance", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
      { name: "Fees", short_name: "Fees", url: "/fees", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
      { name: "Add a student", short_name: "Add student", url: "/students/new", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
