package main

import (
	"fmt"
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/newrelic/go-agent/v3/newrelic"
	"github.com/nobuyo/nrfiber"
)

func main() {
	nrapp, err := newrelic.NewApplication(
		newrelic.ConfigAppName("Add Service"),
		newrelic.ConfigLicense(os.Getenv("NEW_RELIC_LICENSE_KEY")),
	)
	if err != nil {
		fmt.Println("unable to create New Relic Application", err)
	}
	// Initialize the application
	app := fiber.New()

	app.Use(nrfiber.New(nrfiber.Config{
		NewRelicApp: nrapp,
	}))

	fmt.Println("Started")

	// Hello, World!
	app.Get("/admin", func(c *fiber.Ctx) error {
		fmt.Println("--------------------------")
		log.Print("List hats that need moderation")

		var result string

		result = UnmoderatedPic()

		c.Append("Content-Type", "application/json")
		return c.SendString(result)
	})

	// Listen and Server in 0.0.0.0:$PORT
	port := os.Getenv("PORT")
	if port == "" {
		port = "4040"
	}

	log.Fatal(app.Listen(":" + port))
}
