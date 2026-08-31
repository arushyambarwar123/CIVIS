"""
Geo validation utilities using Haversine formula.
No external dependencies — pure Python math.
"""
import math


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great-circle distance between two points on earth.
    Returns distance in metres.
    """
    R = 6_371_000  # Earth radius in metres
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)

    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def is_within_radius(
    centre_lat: float,
    centre_lon: float,
    point_lat: float,
    point_lon: float,
    radius_metres: float,
) -> bool:
    """Return True if the point is within radius_metres of the centre."""
    if None in (centre_lat, centre_lon, point_lat, point_lon):
        return True  # Cannot validate, assume OK
    return haversine_distance(centre_lat, centre_lon, point_lat, point_lon) <= radius_metres


def travel_time_minutes(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Estimate minimum travel time in minutes assuming 60 km/h by road.
    Used for impossible-travel detection.
    """
    dist_km = haversine_distance(lat1, lon1, lat2, lon2) / 1000
    # Assume average road speed 60 km/h
    return (dist_km / 60) * 60  # minutes
