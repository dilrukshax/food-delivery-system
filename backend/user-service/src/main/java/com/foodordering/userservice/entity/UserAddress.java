package com.foodordering.userservice.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_addresses")
public class UserAddress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String addressLine1;

    private String addressLine2;

    @Column(nullable = false)
    private String city;

    private String state;

    @Column(nullable = false)
    private String country;

    @Column(nullable = false)
    private String postalCode;

    private boolean isDefault;

    private Double latitude;

    private Double longitude;

    @CreationTimestamp
    private LocalDateTime createdAt;

    // Constructors
    public UserAddress() {}

    public UserAddress(Integer id, User user, String addressLine1, String addressLine2, 
                      String city, String state, String country, String postalCode, 
                      boolean isDefault, Double latitude, Double longitude, LocalDateTime createdAt) {
        this.id = id;
        this.user = user;
        this.addressLine1 = addressLine1;
        this.addressLine2 = addressLine2;
        this.city = city;
        this.state = state;
        this.country = country;
        this.postalCode = postalCode;
        this.isDefault = isDefault;
        this.latitude = latitude;
        this.longitude = longitude;
        this.createdAt = createdAt;
    }

    // Getters and Setters
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

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

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    // Builder
    public static UserAddressBuilder builder() {
        return new UserAddressBuilder();
    }

    public static class UserAddressBuilder {
        private Integer id;
        private User user;
        private String addressLine1;
        private String addressLine2;
        private String city;
        private String state;
        private String country;
        private String postalCode;
        private boolean isDefault;
        private Double latitude;
        private Double longitude;
        private LocalDateTime createdAt;

        public UserAddressBuilder id(Integer id) { this.id = id; return this; }
        public UserAddressBuilder user(User user) { this.user = user; return this; }
        public UserAddressBuilder addressLine1(String addressLine1) { this.addressLine1 = addressLine1; return this; }
        public UserAddressBuilder addressLine2(String addressLine2) { this.addressLine2 = addressLine2; return this; }
        public UserAddressBuilder city(String city) { this.city = city; return this; }
        public UserAddressBuilder state(String state) { this.state = state; return this; }
        public UserAddressBuilder country(String country) { this.country = country; return this; }
        public UserAddressBuilder postalCode(String postalCode) { this.postalCode = postalCode; return this; }
        public UserAddressBuilder isDefault(boolean isDefault) { this.isDefault = isDefault; return this; }
        public UserAddressBuilder latitude(Double latitude) { this.latitude = latitude; return this; }
        public UserAddressBuilder longitude(Double longitude) { this.longitude = longitude; return this; }
        public UserAddressBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public UserAddress build() {
            return new UserAddress(id, user, addressLine1, addressLine2, city, state, country, 
                                  postalCode, isDefault, latitude, longitude, createdAt);
        }
    }
}
