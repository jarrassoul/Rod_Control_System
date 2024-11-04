package Utiles;

public class Utiles {
    public  boolean isValidPALicensePlate(String plate) {
        String licencePlate = "^[A-Z]{3}-\\d{4}$";
        return plate.matches(licencePlate);
    }
    public boolean isValidHeavyTruckWeight(double weight) {
        // Define the minimum valid weight for heavy trucks (e.g., 100,000 kg)
        double maxHeavyTruckWeight = 100000.0;

        // Check if the weight meets the requirement for heavy trucks
        return weight < maxHeavyTruckWeight;
    }

}
