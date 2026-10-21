package main

import (
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
)

func main() {
	// Conectar ao banco de dados
	db := connectDB()
	defer db.Close()

	// Criar tabelas
	createTables(db)

	// Inicializar Fiber
	app := fiber.New(fiber.Config{
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			code := fiber.StatusInternalServerError
			if e, ok := err.(*fiber.Error); ok {
				code = e.Code
			}
			return c.Status(code).JSON(fiber.Map{
				"error": err.Error(),
			})
		},
	})

	// Middlewares
	app.Use(logger.New())
	app.Use(cors.New())

	// Handler
	bookHandler := NewBookHandler(db)

	// Rotas da API
	api := app.Group("/api/v1")

	// Rotas dos livros
	books := api.Group("/books")
	books.Get("/", bookHandler.GetBooks)       // GET /api/v1/books
	books.Get("/:id", bookHandler.GetBook)     // GET /api/v1/books/:id
	books.Post("/", bookHandler.CreateBook)    // POST /api/v1/books
	books.Put("/:id", bookHandler.UpdateBook)  // PUT /api/v1/books/:id
	books.Delete("/:id", bookHandler.DeleteBook) // DELETE /api/v1/books/:id

	// Rota de health check
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status": "OK",
			"message": "Books API está funcionando",
		})
	})

	// Iniciar servidor
	port := getEnv("PORT", "3000")
	log.Printf("Servidor iniciando na porta %s", port)
	log.Fatal(app.Listen(":" + port))
}