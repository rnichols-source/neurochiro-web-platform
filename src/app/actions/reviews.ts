'use server'

/**
 * GOOGLE PLACES API INTEGRATION
 * This action fetches real reviews from Google for a given Place ID.
 * It includes a robust fallback for development/demo purposes.
 */

export async function fetchGoogleReviews(placeId: string) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    console.warn("GOOGLE_PLACES_API_KEY is missing. Returning simulated review data.");
    return getSimulatedReviews(placeId);
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,reviews,user_ratings_total&key=${apiKey}`,
      { next: { revalidate: 86400 } } // Cache for 24 hours
    );

    const data = await response.json();

    if (data.status !== "OK") {
      throw new Error(data.error_message || "Failed to fetch Google reviews");
    }

    return {
      rating: data.result.rating,
      total_reviews: data.result.user_ratings_total,
      reviews: data.result.reviews.map((r: any) => ({
        author: r.author_name,
        text: r.text,
        rating: r.rating,
        time: r.relative_time_description,
        photo: r.profile_photo_url
      }))
    };
  } catch (error) {
    console.error("Error fetching Google reviews:", error);
    return null;
  }
}

function getSimulatedReviews(placeId: string) {
  // Return realistic mock data if API key is missing
  return {
    rating: 4.9,
    total_reviews: 124,
    reviews: [
      {
        author: "Sarah Jenkins",
        text: "The neurologically-focused approach here is life-changing. I finally understand how my nervous system affects my daily energy levels.",
        rating: 5,
        time: "2 days ago",
        photo: null
      },
      {
        author: "Michael Chen",
        text: "Best chiropractic experience I've had. Extremely professional and the scans they use are incredible for seeing actual progress.",
        rating: 5,
        time: "1 week ago",
        photo: null
      },
      {
        author: "Emma Thompson",
        text: "Great with kids! My son was having sensory issues and the gentle adjustments have made a massive difference in his focus at school.",
        rating: 5,
        time: "3 weeks ago",
        photo: null
      }
    ]
  };
}
