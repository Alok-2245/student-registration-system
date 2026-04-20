# Student Registration System

Student Registration System is a responsive web application built with HTML, CSS, and JavaScript DOM manipulation. It allows users to register student details, display records dynamically, edit entries, delete records, and search or filter the student list from the interface.

## Features

- Responsive layout for mobile, tablet, and desktop screens
- Structured registration form with validation
- Student list display using a table on larger screens and cards on smaller screens
- Add, edit, and delete student records with DOM updates
- Search by name, student ID, email, or department
- Department-based filtering
- Contact number validation requiring at least 10 digits
- Local storage support to preserve records between refreshes

## Project Structure

- `index.html` contains the layout and semantic sections
- `styles.css` contains custom styling and responsive breakpoints
- `app.js` contains DOM logic, validation, storage handling, and interactions

## How to Run

1. Open `index.html` in any modern web browser.
2. Fill out the student registration form.
3. Submit the form to add a student record.
4. Use the display section to search, filter, edit, or delete students.

## Notes

- The app is built with plain HTML, CSS, and JavaScript.
- Student data is stored in the browser using `localStorage`.
- No build tools or external dependencies are required.
