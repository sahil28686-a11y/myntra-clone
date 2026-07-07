// Re-exports from the API service layer for backward compatibility
import {
  medusaClient as _medusaClient,
  formatPrice as _formatPrice,
  checkPincode as _checkPincode,
  getProductReviews as _getProductReviews,
  submitReview as _submitReview,
  getWishlist as _getWishlist,
  addToWishlist as _addToWishlist,
  removeFromWishlist as _removeFromWishlist,
  requestReturn as _requestReturn,
  getReturns as _getReturns,
  getProducts as _getProducts,
  getProduct as _getProduct,
  getProductById as _getProductById,
  getCollections as _getCollections,
  getCollectionByHandle as _getCollectionByHandle,
  getCategories as _getCategories,
  createCart as _createCart,
  getCart as _getCart,
  addToCart as _addToCart,
  updateCartItem as _updateCartItem,
  removeCartItem as _removeCartItem,
  setCartShippingAddress as _setCartShippingAddress,
  setCartShippingMethod as _setCartShippingMethod,
  createPaymentSession as _createPaymentSession,
  setPaymentSession as _setPaymentSession,
  completeCart as _completeCart,
  applyCartDiscount as _applyCartDiscount,
  removeCartDiscount as _removeCartDiscount,
  getShippingOptions as _getShippingOptions,
  getRegions as _getRegions,
  getOrders as _getOrders,
  getOrder as _getOrder,
  registerCustomer as _registerCustomer,
  loginCustomer as _loginCustomer,
  logoutCustomer as _logoutCustomer,
  isAuthenticated as _isAuthenticated,
  formatPriceRupees as _formatPriceRupees,
  getCustomer as _getCustomer,
  updateCustomer as _updateCustomer,
  addCustomerAddress as _addCustomerAddress,
  updateCustomerAddress as _updateCustomerAddress,
  deleteCustomerAddress as _deleteCustomerAddress,
  getVariantPrice as _getVariantPrice,
  getCheapestVariantPrice as _getCheapestVariantPrice,
  getProductThumbnail as _getProductThumbnail,
  getProductImages as _getProductImages,
} from "./api"

export const medusaClient = _medusaClient
export const formatPrice = _formatPrice
export const checkPincode = _checkPincode
export const getProductReviews = _getProductReviews
export const submitReview = _submitReview
export const getWishlist = _getWishlist
export const addToWishlist = _addToWishlist
export const removeFromWishlist = _removeFromWishlist
export const requestReturn = _requestReturn
export const getReturns = _getReturns
export const getProducts = _getProducts
export const getProduct = _getProduct
export const getProductById = _getProductById
export const getCollections = _getCollections
export const getCollectionByHandle = _getCollectionByHandle
export const getCategories = _getCategories
export const createCart = _createCart
export const getCart = _getCart
export const addToCart = _addToCart
export const updateCartItem = _updateCartItem
export const removeCartItem = _removeCartItem
export const setCartShippingAddress = _setCartShippingAddress
export const setCartShippingMethod = _setCartShippingMethod
export const createPaymentSession = _createPaymentSession
export const setPaymentSession = _setPaymentSession
export const completeCart = _completeCart
export const applyCartDiscount = _applyCartDiscount
export const removeCartDiscount = _removeCartDiscount
export const getShippingOptions = _getShippingOptions
export const getRegions = _getRegions
export const getOrders = _getOrders
export const getOrder = _getOrder
export const registerCustomer = _registerCustomer
export const loginCustomer = _loginCustomer
export const logoutCustomer = _logoutCustomer
export const isAuthenticated = _isAuthenticated
export const formatPriceRupees = _formatPriceRupees
export const getCustomer = _getCustomer
export const updateCustomer = _updateCustomer
export const addCustomerAddress = _addCustomerAddress
export const updateCustomerAddress = _updateCustomerAddress
export const deleteCustomerAddress = _deleteCustomerAddress
export const getVariantPrice = _getVariantPrice
export const getCheapestVariantPrice = _getCheapestVariantPrice
export const getProductThumbnail = _getProductThumbnail
export const getProductImages = _getProductImages

export type {
  MedusaProduct,
  MedusaVariant,
  MedusaProductOption,
  MedusaCollection,
  MedusaCategory,
  MedusaCart,
  MedusaLineItem,
  MedusaAddress,
  MedusaOrder,
  MedusaCustomer,
} from "./api"
