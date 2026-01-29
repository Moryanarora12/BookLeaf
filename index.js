const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// ===== Seed Data =====

const authors = [
  { id: 1, name: "Priya Sharma", email: "priya@email.com", bank: "1234567890", ifsc: "HDFC0001234" },
  { id: 2, name: "Rahul Verma", email: "rahul@email.com", bank: "0987654321", ifsc: "ICIC0005678" },
  { id: 3, name: "Anita Desai", email: "anita@email.com", bank: "5678901234", ifsc: "SBIN0009012" }
];

const books = [
  { id: 1, title: "The Silent River", author_id: 1, royalty: 45 },
  { id: 2, title: "Midnight in Mumbai", author_id: 1, royalty: 60 },
  { id: 3, title: "Code & Coffee", author_id: 2, royalty: 75 },
  { id: 4, title: "Startup Diaries", author_id: 2, royalty: 50 },
  { id: 5, title: "Poetry of Pain", author_id: 2, royalty: 30 },
  { id: 6, title: "Garden of Words", author_id: 3, royalty: 40 }
];

const sales = [
  { book_id: 1, quantity: 25, date: "2025-01-05" },
  { book_id: 1, quantity: 40, date: "2025-01-12" },

  { book_id: 2, quantity: 15, date: "2025-01-08" },

  { book_id: 3, quantity: 60, date: "2025-01-03" },
  { book_id: 3, quantity: 45, date: "2025-01-15" },

  { book_id: 4, quantity: 30, date: "2025-01-10" },

  { book_id: 5, quantity: 20, date: "2025-01-18" },

  { book_id: 6, quantity: 10, date: "2025-01-20" }
];
// ===== Helper Functions =====

function calculateAuthorEarnings(authorId) {
  const authorBooks = books.filter(b => b.author_id === authorId);

  let total = 0;

  authorBooks.forEach(book => {
    const bookSales = sales.filter(s => s.book_id === book.id);
    const sold = bookSales.reduce((sum, s) => sum + s.quantity, 0);
    total += sold * book.royalty;
  });

  return total;
}

// ===== GET /authors =====

app.get("/authors", (req, res) => {
  const result = authors.map(author => {
    const totalEarnings = calculateAuthorEarnings(author.id);

    return {
      id: author.id,
      name: author.name,
      total_earnings: totalEarnings,
      current_balance: totalEarnings
    };
  });

  res.json(result);
});
// ===== GET /authors/:id =====

app.get("/authors/:id", (req, res) => {
  const authorId = parseInt(req.params.id);
  const author = authors.find(a => a.id === authorId);

  if (!author) {
    return res.status(404).json({ error: "Author not found" });
  }

  const authorBooks = books.filter(b => b.author_id === authorId);

  const booksData = authorBooks.map(book => {
    const bookSales = sales.filter(s => s.book_id === book.id);
    const totalSold = bookSales.reduce((sum, s) => sum + s.quantity, 0);
    const totalRoyalty = totalSold * book.royalty;

    return {
      id: book.id,
      title: book.title,
      royalty_per_sale: book.royalty,
      total_sold: totalSold,
      total_royalty: totalRoyalty
    };
  });

  const totalEarnings = calculateAuthorEarnings(authorId);

  res.json({
    id: author.id,
    name: author.name,
    email: author.email,
    total_books: authorBooks.length,
    total_earnings: totalEarnings,
    current_balance: totalEarnings,
    books: booksData
  });
});
// ===== GET /authors/:id/sales =====

app.get("/authors/:id/sales", (req, res) => {
  const authorId = parseInt(req.params.id);
  const author = authors.find(a => a.id === authorId);

  if (!author) {
    return res.status(404).json({ error: "Author not found" });
  }

  const authorBooks = books.filter(b => b.author_id === authorId).map(b => b.id);

  const authorSales = sales
    .filter(s => authorBooks.includes(s.book_id))
    .map(s => {
      const book = books.find(b => b.id === s.book_id);
      return {
        book_title: book.title,
        quantity: s.quantity,
        royalty_earned: s.quantity * book.royalty,
        sale_date: s.date
      };
    })
    .sort((a, b) => new Date(b.sale_date) - new Date(a.sale_date));

  res.json(authorSales);
});
// ===== Withdrawals Storage =====

let withdrawals = [];

// ===== POST /withdrawals =====

app.post("/withdrawals", (req, res) => {
  const { author_id, amount } = req.body;

  const author = authors.find(a => a.id === author_id);
  if (!author) {
    return res.status(404).json({ error: "Author not found" });
  }

  if (amount < 500) {
    return res.status(400).json({ error: "Minimum withdrawal amount is ₹500" });
  }

  const totalEarnings = calculateAuthorEarnings(author_id);

  const withdrawnAmount = withdrawals
    .filter(w => w.author_id === author_id)
    .reduce((sum, w) => sum + w.amount, 0);

  const currentBalance = totalEarnings - withdrawnAmount;

  if (amount > currentBalance) {
    return res.status(400).json({ error: "Insufficient balance" });
  }

  const withdrawal = {
    id: withdrawals.length + 1,
    author_id,
    amount,
    status: "pending",
    created_at: new Date().toISOString()
  };

  withdrawals.push(withdrawal);

  res.status(201).json({
    ...withdrawal,
    new_balance: currentBalance - amount
  });
});
// ===== GET /authors/:id/withdrawals =====

app.get("/authors/:id/withdrawals", (req, res) => {
  const authorId = parseInt(req.params.id);
  const author = authors.find(a => a.id === authorId);

  if (!author) {
    return res.status(404).json({ error: "Author not found" });
  }

  const authorWithdrawals = withdrawals
    .filter(w => w.author_id === authorId)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  res.json(authorWithdrawals);
});
// ===== Server Start =====

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
