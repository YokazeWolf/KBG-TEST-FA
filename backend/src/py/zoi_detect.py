import cv2
import numpy as np
import sys
import json

def analyze_zoi(image_path):
    image = cv2.imread(image_path)
    if image is None:
        raise ValueError("Could not read the image.")

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    # Invert if needed: make sure ZoIs are white (foreground)
    if np.sum(thresh == 255) < np.sum(thresh == 0):
        thresh = cv2.bitwise_not(thresh)

    # Find contours in the thresholded mask
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    scale_factor = 0.05  # Adjust this based on calibration
    results = []

    # Print all contour areas for debugging
    for idx, c in enumerate(contours):
        area = cv2.contourArea(c)
        print(f"Contour {idx}: area={area}", file=sys.stderr)

    # If only one contour is found, the two ZoIs are likely connected in the mask.
    # To force separation, try eroding the mask slightly and re-detecting contours.
    if len(contours) == 1:
        kernel = np.ones((5, 5), np.uint8)
        eroded = cv2.erode(thresh, kernel, iterations=1)
        contours, _ = cv2.findContours(eroded, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
        # Debug
        for idx, c in enumerate(contours):
            area = cv2.contourArea(c)
            print(f"After erosion - Contour {idx}: area={area}", file=sys.stderr)

    for c in contours:
        area = cv2.contourArea(c)
        if area < 100:
            continue
        (x, y), radius = cv2.minEnclosingCircle(c)
        diameter_pixels = 2 * radius
        diameter_mm = diameter_pixels * scale_factor
        results.append({
            "center_x": x,
            "center_y": y,
            "diameter_mm": diameter_mm
        })

    if not results:
        raise ValueError("No valid contours found.")

    return results

if __name__ == "__main__":
    try:
        image_path = sys.argv[1]
        result = analyze_zoi(image_path)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)
