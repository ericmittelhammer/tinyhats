package main

import (
	"fmt"
	"log"
	"os"

	// "fmt"
	"github.com/gofiber/fiber/v2"
	"github.com/newrelic/go-agent/v3/newrelic"
	"github.com/nobuyo/nrfiber"
)

func main() {
	nrapp, err := newrelic.NewApplication(
		newrelic.ConfigAppName("Add Service"),
		newrelic.ConfigLicense(os.Getenv("NEW_RELIC_LICENSE_KEY")),
		newrelic.ConfigDebugLogger(os.Stdout),
	)
	if err != nil {
		fmt.Println("unable to create New Relic Application", err)
	}
	// Initialize the application
	app := fiber.New()

	app.Use(nrfiber.New(nrfiber.Config{
		NewRelicApp: nrapp,
	}))

	app.Get("/moderate", func(c *fiber.Ctx) error {
		log.Print("Moderate request received")
		var approval string = c.Query("approve")
		var id string = c.Query("id")
		var result string

		if approval == "true" {
			result = ApprovePicture(id)
		} else if approval == "false" {
			result = DeletePicture(id)
		} else if approval == "" || id == "" {
			result = "Please tell us what picture you would like to approve and a valid id."
		} else {
			result = "Please tell us what picture you would like to approve and a valid id."
		}

		c.Append("Content-Type", "application/json")
		return c.SendString(result)
	})

	// Listen and Server in 0.0.0.0:$PORT
	port := os.Getenv("PORT")
	if port == "" {
		port = "5000"
	}

	log.Fatal(app.Listen(":" + port))
}
