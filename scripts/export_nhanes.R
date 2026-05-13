library(NHANES)
library(jsonlite)

# Load NHANES data
data(NHANES)

# Filter to adults (age >= 18) with complete height and weight data
adults <- NHANES[NHANES$Age >= 18 &
                 !is.na(NHANES$Height) &
                 !is.na(NHANES$Weight), ]

# Select relevant columns
selected_data <- data.frame(
  Height = adults$Height,
  Weight = adults$Weight,
  BMI = adults$BMI,
  Age = adults$Age,
  Gender = adults$Gender,
  Diabetes = adults$Diabetes,
  PhysActive = adults$PhysActive
)

# Remove any remaining NA rows
clean_data <- na.omit(selected_data)

# Export to JSON
write_json(clean_data, "data/nhanes_adults.json", pretty = TRUE)

cat("Total observations:", nrow(clean_data), "\n")
cat("Mean height:", mean(clean_data$Height), "cm\n")
cat("Mean weight:", mean(clean_data$Weight), "kg\n")
