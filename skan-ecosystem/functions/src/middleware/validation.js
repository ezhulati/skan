const { body, validationResult } = require("express-validator");

/**
 * Check validation results and return errors
 */
function checkValidationResult(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: "Validation failed",
      details: errors.array().map(error => ({
        field: error.path || error.param,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
}

/**
 * Validate email format
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
function isValidPassword(password) {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
}

/**
 * Validate user role
 */
function isValidRole(role) {
  const validRoles = ["staff", "manager", "admin"];
  return validRoles.includes(role);
}

/**
 * Validate order status
 */
function isValidOrderStatus(status) {
  const validStatuses = ["new", "preparing", "ready", "served"];
  return validStatuses.includes(status);
}

/**
 * Sanitize string input
 */
function sanitizeString(str) {
  if (typeof str !== "string") return str;
  
  return str
    .trim()
    .replace(/[<>]/g, "") // Remove potential HTML tags
    .substring(0, 1000); // Limit length
}

/**
 * User invitation validation rules
 */
const validateUserInvitation = [
  body("email")
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail()
    .custom((email) => {
      if (!isValidEmail(email)) {
        throw new Error("Invalid email format");
      }
      return true;
    }),
  
  body("fullName")
    .isLength({ min: 2, max: 100 })
    .withMessage("Full name must be between 2 and 100 characters")
    .matches(/^[a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÇĞğıİöÖüÜşŞ\s'-]+$/)
    .withMessage("Full name contains invalid characters")
    .customSanitizer(sanitizeString),
  
  body("role")
    .isIn(["staff", "manager"])
    .withMessage("Role must be either 'staff' or 'manager'")
    .custom((role) => {
      if (!isValidRole(role)) {
        throw new Error("Invalid role specified");
      }
      return true;
    }),
  
  checkValidationResult
];

/**
 * User registration validation rules
 */
const validateUserRegistration = [
  body("email")
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail(),
  
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .custom((password) => {
      if (!isValidPassword(password)) {
        throw new Error("Password must contain at least 1 uppercase, 1 lowercase, and 1 number");
      }
      return true;
    }),
  
  body("fullName")
    .isLength({ min: 2, max: 100 })
    .withMessage("Full name must be between 2 and 100 characters")
    .customSanitizer(sanitizeString),
  
  body("role")
    .optional()
    .isIn(["staff", "manager", "admin"])
    .withMessage("Invalid role specified"),
  
  checkValidationResult
];

/**
 * Login validation rules
 */
const validateLogin = [
  body("email")
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail(),
  
  body("password")
    .isLength({ min: 1 })
    .withMessage("Password is required"),
  
  checkValidationResult
];

/**
 * Order creation validation rules
 */
const validateOrderCreation = [
  body("venueId")
    .isLength({ min: 1 })
    .withMessage("Venue ID is required")
    .customSanitizer(sanitizeString),
  
  body("tableNumber")
    .isLength({ min: 1, max: 20 })
    .withMessage("Table number is required")
    .customSanitizer(sanitizeString),
  
  body("customerName")
    .optional()
    .isLength({ max: 100 })
    .withMessage("Customer name too long")
    .customSanitizer(sanitizeString),
  
  body("items")
    .isArray({ min: 1 })
    .withMessage("At least one item is required"),
  
  body("items.*.id")
    .isLength({ min: 1 })
    .withMessage("Item ID is required"),
  
  body("items.*.name")
    .isLength({ min: 1 })
    .withMessage("Item name is required"),
  
  body("items.*.price")
    .isFloat({ min: 0 })
    .withMessage("Item price must be a positive number"),
  
  body("items.*.quantity")
    .isInt({ min: 1, max: 20 })
    .withMessage("Item quantity must be between 1 and 20"),
  
  body("specialInstructions")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Special instructions too long")
    .customSanitizer(sanitizeString),
  
  checkValidationResult
];

/**
 * Order status update validation rules
 */
const validateOrderStatusUpdate = [
  body("status")
    .isIn(["new", "preparing", "ready", "served"])
    .withMessage("Invalid order status")
    .custom((status) => {
      if (!isValidOrderStatus(status)) {
        throw new Error("Invalid order status");
      }
      return true;
    }),
  
  checkValidationResult
];

/**
 * Accept invitation validation rules
 */
const validateAcceptInvitation = [
  body("token")
    .isLength({ min: 1 })
    .withMessage("Invitation token is required"),
  
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .custom((password) => {
      if (!isValidPassword(password)) {
        throw new Error("Password must contain at least 1 uppercase, 1 lowercase, and 1 number");
      }
      return true;
    }),
  
  checkValidationResult
];

/**
 * User update validation rules
 */
const validateUserUpdate = [
  body("fullName")
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage("Full name must be between 2 and 100 characters")
    .customSanitizer(sanitizeString),
  
  body("role")
    .optional()
    .isIn(["staff", "manager", "admin"])
    .withMessage("Invalid role specified"),
  
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),
  
  checkValidationResult
];

module.exports = {
  checkValidationResult,
  isValidEmail,
  isValidPassword,
  isValidRole,
  isValidOrderStatus,
  sanitizeString,
  validateUserInvitation,
  validateUserRegistration,
  validateLogin,
  validateOrderCreation,
  validateOrderStatusUpdate,
  validateAcceptInvitation,
  validateUserUpdate
};