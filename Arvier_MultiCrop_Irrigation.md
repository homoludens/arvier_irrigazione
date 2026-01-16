Project Blueprint: Arvier Multi-Crop Irrigation & Simulation Tool (2026) 

1\. Project Vision   
A mobile-first web app for farmers in **Arvier, Aosta Valley**. It manages irrigation for diverse alpine crops (Apples, Vineyards, and Grass/Pasture) using GPS-based weather data from Open-Meteo. It features a "Pre-Rain Recharge" logic to protect the valley’s soil and a 10-year historical simulation for climate resilience planning.   
---

2\. Multi-Crop Logic (GDD & Kc)   
The engine uses a modular `CropConfig` structure. 

| Crop  | Base Temp | Initial Kc | Peak Kc | Phase Triggers (GDD) |
| ----- | ----- | ----- | ----- | ----- |
| **Renette Apple** | 4.5°C | 0.40 | 1.00 | Bloom (350), Expansion (800) |
| **Vineyard (Wine)** | 10.0°C | 0.30 | 0.70 | Budburst (200), Harvest (1200) |
| **Pasture (Grass)** | 5.0°C | 0.70 | 1.05 | Growth (Start of Season) |

---

3\. Location & Mapping Integration 

* **GPS Start:** On first load, the app requests mobile GPS permissions to pinpoint the specific plot in Arvier.  
* **Leaflet Map:** Users can "Fine-tune" the location by dragging a pin on a satellite map (essential for Aosta Valley’s steep micro-climates).  
* **Elevation Adjustment:** Open-Meteo API automatically adjusts ![][image1]  
* ET0cap E cap T sub 0  
* 𝐸𝑇0 based on the elevation of the selected coordinates. 


4. Technology:
 * using next.js 16
 * should be deployable for free on vercel
 * mobile must be good.
