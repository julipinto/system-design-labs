package main

import (
	"database/sql"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
)

type BookHandler struct {
	db *sql.DB
}

func NewBookHandler(db *sql.DB) *BookHandler {
	return &BookHandler{db: db}
}

// GET /books - Listar todos os livros
func (h *BookHandler) GetBooks(c *fiber.Ctx) error {
	rows, err := h.db.Query(`
		SELECT id, title, author, isbn, published_year, created_at, updated_at 
		FROM books ORDER BY id DESC
	`)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Erro ao buscar livros",
		})
	}
	defer rows.Close()

	var books []Book
	for rows.Next() {
		var book Book
		err := rows.Scan(
			&book.ID,
			&book.Title,
			&book.Author,
			&book.ISBN,
			&book.PublishedYear,
			&book.CreatedAt,
			&book.UpdatedAt,
		)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error": "Erro ao processar dados dos livros",
			})
		}
		books = append(books, book)
	}

	return c.JSON(fiber.Map{
		"books": books,
		"total": len(books),
	})
}

// GET /books/:id - Buscar livro por ID
func (h *BookHandler) GetBook(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "ID inválido",
		})
	}

	var book Book
	err = h.db.QueryRow(`
		SELECT id, title, author, isbn, published_year, created_at, updated_at 
		FROM books WHERE id = $1
	`, id).Scan(
		&book.ID,
		&book.Title,
		&book.Author,
		&book.ISBN,
		&book.PublishedYear,
		&book.CreatedAt,
		&book.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return c.Status(404).JSON(fiber.Map{
			"error": "Livro não encontrado",
		})
	}

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Erro ao buscar livro",
		})
	}

	return c.JSON(book)
}

// POST /books - Criar novo livro
func (h *BookHandler) CreateBook(c *fiber.Ctx) error {
	var req CreateBookRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "Dados inválidos",
		})
	}

	if req.Title == "" || req.Author == "" || req.ISBN == "" {
		return c.Status(400).JSON(fiber.Map{
			"error": "Título, autor e ISBN são obrigatórios",
		})
	}

	var book Book
	err := h.db.QueryRow(`
		INSERT INTO books (title, author, isbn, published_year, created_at, updated_at) 
		VALUES ($1, $2, $3, $4, $5, $5) 
		RETURNING id, title, author, isbn, published_year, created_at, updated_at
	`, req.Title, req.Author, req.ISBN, req.PublishedYear, time.Now()).Scan(
		&book.ID,
		&book.Title,
		&book.Author,
		&book.ISBN,
		&book.PublishedYear,
		&book.CreatedAt,
		&book.UpdatedAt,
	)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Erro ao criar livro",
		})
	}

	return c.Status(201).JSON(book)
}

// PUT /books/:id - Atualizar livro
func (h *BookHandler) UpdateBook(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "ID inválido",
		})
	}

	var req UpdateBookRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "Dados inválidos",
		})
	}

	if req.Title == "" || req.Author == "" || req.ISBN == "" {
		return c.Status(400).JSON(fiber.Map{
			"error": "Título, autor e ISBN são obrigatórios",
		})
	}

	var book Book
	err = h.db.QueryRow(`
		UPDATE books 
		SET title = $1, author = $2, isbn = $3, published_year = $4, updated_at = $5
		WHERE id = $6
		RETURNING id, title, author, isbn, published_year, created_at, updated_at
	`, req.Title, req.Author, req.ISBN, req.PublishedYear, time.Now(), id).Scan(
		&book.ID,
		&book.Title,
		&book.Author,
		&book.ISBN,
		&book.PublishedYear,
		&book.CreatedAt,
		&book.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return c.Status(404).JSON(fiber.Map{
			"error": "Livro não encontrado",
		})
	}

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Erro ao atualizar livro",
		})
	}

	return c.JSON(book)
}

// DELETE /books/:id - Deletar livro
func (h *BookHandler) DeleteBook(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "ID inválido",
		})
	}

	result, err := h.db.Exec("DELETE FROM books WHERE id = $1", id)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Erro ao deletar livro",
		})
	}

	_, err = result.RowsAffected()
	return c.Status(204).Send(nil)
}
