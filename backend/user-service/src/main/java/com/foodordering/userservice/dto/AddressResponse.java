package com.foodordering.userservice.dto;

public class AddressResponse {
    private Integer id;
    private String addressLine1;
    private String addressLine2;
    private String city;
    private String state;
    private String country;
    private String postalCode;
    private boolean isDefault;
    private Double latitude;
    private Double longitude;

    // Constructors
    public AddressResponse() {}

    public AddressResponse(Integer id, String addressLine1, String addressLine2, String city, 
                          String state, String country, String postalCode, boolean isDefault, 
                          Double latitude, Double longitude) {
        this.id = id;
        this.addressLine1 = addressLine1;
        this.addressLine2 = addressLine2;
        this.city = city;
        this.state = state;
        this.country = country;
        this.postalCode = postalCode;
        this.isDefault = isDefault;
        this.latitude = latitude;
        this.longitude = longitude;
    }

    // Getters and Setters
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getAddressLine1() { return addressLine1; }
    public void setAddressLine1(String addressLine1) { this.addressLine1 = addressLine1; }

    public String getAddressLine2() { return addressLine2; }
    public void setAddressLine2(String addressLine2) { this.addressLine2 = addressLine2; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }

    public String getPostalCode() { return postalCode; }
    public void setPostalCode(String postalCode) { this.postalCode = postalCode; }

    public boolean isDefault() { return isDefault; }
    public void setDefault(boolean isDefault) { this.isDefault = isDefault; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    // Builder
    public static AddressResponseBuilder builder() {
        return new AddressResponseBuilder();
    }

    public static class AddressResponseBuilder {
        private Integer id;
        private String addressLine1;
        private String addressLine2;
        private String city;
        private String state;
        private String country;
        private String postalCode;
        private boolean isDefault;
        private Double latitude;
        private Double longitude;

        public AddressResponseBuilder id(Integer id) { this.id = id; return this; }
        public AddressResponseBuilder addressLine1(String addressLine1) { this.addressLine1 = addressLine1; return this; }
        public AddressResponseBuilder addressLine2(String addressLine2) { this.addressLine2 = addressLine2; return this; }
        public AddressResponseBuilder city(String city) { this.city = city; return this; }
        public AddressResponseBuilder state(String state) { this.state = state; return this; }
        public AddressResponseBuilder country(String country) { this.country = country; return this; }
        public AddressResponseBuilder postalCode(String postalCode) { this.postalCode = postalCode; return this; }
        public AddressResponseBuilder isDefault(boolean isDefault) { this.isDefault = isDefault; return this; }
        public AddressResponseBuilder latitude(Double latitude) { this.latitude = latitude; return this; }
        public AddressResponseBuilder longitude(Double longitude) { this.longitude = longitude; return this; }

        public AddressResponse build() {
            return new AddressResponse(id, addressLine1, addressLine2, city, state, country, 
                                     postalCode, isDefault, latitude, longitude);
        }
    }
}
