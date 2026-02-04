# Quiz Platform - Technical Documentation

## 1. Assumptions, Scope, and Approach

### Assumptions

- The assignment is intended to evaluate overall system design, data modeling, and implementation
  clarity rather than production-ready completeness.
- A simple authentication mechanism is acceptable for an internal/admin-only dashboard.
- Using Next.js for both frontend and backend APIs is acceptable, avoiding the need for a separate
  server.
- PostgreSQL is sufficient for modeling quizzes, questions, options, and user attempts.

### Scope

The implemented scope includes:

- **Admin authentication** using environment-based credentials.
- **Admin dashboard** for creating and managing quizzes.
- **Support for multiple question types:**
  - True / False
  - Multiple Choice
- **Quiz structure** including:
  - Quiz metadata (title, description)
  - Questions with type and order
  - Options with order and answer flag
- **Public quiz participation:**
  - Users can enter name and email
  - Users can attempt the quiz
  - Results are shown immediately after submission
- **Persistence** of quiz attempts and user responses.
- **Backend APIs** for updating:
  - Quiz details
  - Questions
  - Options
- **Deployment** using NeonDB (PostgreSQL) in production.

#### Out of Scope

The following items were intentionally excluded from this implementation:

- Full user/admin management system
- JWT-based authentication
- Advanced validation and cascading deletes
- Analytics and reporting dashboards
- Extensive UI/UX polish

### Approach

1. Use **Next.js** to implement both frontend UI and backend APIs in a single project.
2. Authenticate admin access using environment variables and cookie-based authentication to keep the
   setup simple.
3. Design a **normalized database structure:**
   - `quiz` table for quiz metadata
   - `question` table linked to quizzes
   - `option` table linked to questions
   - Tables for storing quiz attempts and user responses
4. Build the admin dashboard incrementally:
   - Login
   - Create quiz
   - Add questions and options
5. Focus on correctness and clarity rather than covering all edge cases.
6. Keep APIs modular (separate APIs for quiz, question, and option updates).
7. Manually test flows for admin creation and public quiz participation.

---

## 2. Scope Changes During Implementation

During implementation, a few conscious trade-offs and simplifications were made:

### Authentication

- Instead of implementing a full admin user database and JWT-based authentication, admin credentials
  are stored in environment variables and authenticated via cookies.
- This reduced complexity while still demonstrating secure access control.

### Question Types

- Only **True/False** and **Multiple Choice** questions were implemented.
- Input/text-based questions were intentionally excluded to avoid additional scoring and validation
  complexity.

### Ordering

- Question and option ordering is manually entered in the frontend.
- Automatic ordering and validation (e.g., preventing duplicate order values) were deferred.

### Delete Operations

- Quiz deletion was not implemented to avoid complex cascading delete handling across related
  tables.
- Related cleanup logic (questions, options, responses) would be added with more time.

### Public Quiz Flow

- User details (name and email) and quiz questions are collected on the same page.
- A multi-step flow (collect user details first, then start quiz) was deferred.

**Note:** These scope changes were made intentionally to keep the implementation focused and stable
within the available time.

---

## 3. Reflection and Next Steps

If additional time were available, the next improvements would include:

### Authentication & User Management

- Implement proper admin user management with hashed passwords and JWT-based authentication.
- Add role-based access control if multiple admins are required.

### Data Integrity & Validation

- Enforce validation rules for question and option ordering.
- Automatically restrict options based on question type (e.g., exactly two options for True/False).
- Handle cascading deletes safely when removing quizzes or questions.

### Quiz Logic Enhancements

- Add support for text/input-based questions with configurable scoring.
- Improve handling when changing question types (e.g., trimming options when switching to
  True/False).

### Analytics & Insights

- Show quiz attempt statistics in the admin dashboard:
  - Number of attendees per quiz
  - Average scores
  - Most attempted quizzes
- Display individual user attempts and scores.

### User Experience

- Improve UI/UX and interactivity.
- Introduce a step-based quiz flow.
- Add better feedback states and validations.

---

## Summary

Overall, the current implementation focuses on **core functionality and clarity**, with clear paths
for scaling and enhancement.
