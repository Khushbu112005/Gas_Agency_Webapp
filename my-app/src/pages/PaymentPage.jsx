import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../Firebase";
import Navbar from "../components/Navbar";

function PaymentPage() {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingBooking, setFetchingBooking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadBooking() {
      try {
        setFetchingBooking(true);
        const docRef = doc(db, "bookings", bookingId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setBooking({ id: docSnap.id, ...docSnap.data() });
        } else {
          alert("Booking record not found.");
          navigate("/client-dashboard");
        }
      } catch (err) {
        console.error("Error loading booking for payment:", err);
      } finally {
        setFetchingBooking(false);
      }
    }
    if (bookingId) {
      loadBooking();
    }
  }, [bookingId, navigate]);

  const handleCardNumberChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 16) value = value.slice(0, 16);
    // Format card number with spaces (4 blocks of 4)
    const formatted = value.match(/.{1,4}/g)?.join(" ") || "";
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 4) value = value.slice(0, 4);
    if (value.length > 2) {
      value = `${value.slice(0, 2)}/${value.slice(2)}`;
    }
    setExpiry(value);
  };

  const handleCvvChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 3) value = value.slice(0, 3);
    setCvv(value);
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simulate gateway delay
      await new Promise((r) => setTimeout(r, 2000));
      const bookingRef = doc(db, "bookings", bookingId);
      await updateDoc(bookingRef, {
        paymentStatus: "paid",
      });

      alert("Secure payment process successfully completed!");
      navigate("/client-dashboard");
    } catch (error) {
      alert("Payment failed: " + error.message);
      setLoading(false);
    }
  };

  const basePrice = booking?.cylinderType === "Commercial" ? 1600 : 900;
  const count = booking?.extra ? 2 : 1;
  const price = basePrice * count;

  if (fetchingBooking) {
    return (
      <div className="app-container">
        <Navbar />
        <div className="loader-container" style={{ minHeight: "80vh" }}>
          <div className="loader-spinner"></div>
          <p className="loader-text">Initializing checkout gateway...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Navbar />

      <main className="main-content" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "calc(100vh - 120px)" }}>
        <div className="glass-card" style={{ maxWidth: "800px", width: "100%", padding: "2.5rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "2.5rem" }}>
            
            {/* Payment Details Form */}
            <div>
              <header className="mb-3">
                <h2 style={{ margin: 0, fontSize: '1.6rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <i className="fas fa-shield-halved" style={{ color: '#ff4b2b' }}></i>
                  Secure Checkout
                </h2>
                <p className="text-muted" style={{ margin: '0.3rem 0 0 0', fontSize: '0.85rem' }}>Enter credit/debit card credentials to pay.</p>
              </header>

              <form onSubmit={handlePayment}>
                <div className="form-group">
                  <label className="form-label">Cardholder Name</label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Card Number</label>
                  <input
                    type="text"
                    placeholder="0000 0000 0000 0000"
                    value={cardNumber}
                    onChange={handleCardNumberNumber => handleCardNumberChange(handleCardNumberNumber)}
                    required
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div className="form-group">
                    <label className="form-label">Expiration (MM/YY)</label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      value={expiry}
                      onChange={handleExpiryChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">CVV</label>
                    <input
                      type="password"
                      placeholder="•••"
                      value={cvv}
                      onChange={handleCvvChange}
                      onFocus={() => setIsFlipped(true)}
                      onBlur={() => setIsFlipped(false)}
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-success" style={{ width: "100%", marginTop: "1rem" }} disabled={loading}>
                  {loading ? (
                    <>
                      <i className="fas fa-circle-notch fa-spin"></i> Processing Securely...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-lock-open"></i> Pay ₹{price} Now
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Visual Card Widget & Order Summary */}
            <div className="payment-area">
              {/* Virtual Card Preview */}
              <div className={`card-widget ${isFlipped ? "flipped" : ""}`}>
                <div className="card-widget-inner">
                  {/* Front Face */}
                  <div className="card-face card-face-front">
                    <div className="flex-between">
                      <div className="card-chip"></div>
                      <i className="fab fa-cc-visa" style={{ fontSize: "2rem" }}></i>
                    </div>
                    <div className="card-number-display">
                      {cardNumber || "•••• •••• •••• ••••"}
                    </div>
                    <div className="card-meta-row">
                      <div>
                        <div className="card-label">Card Holder</div>
                        <div className="card-val">{cardHolder || "FULL NAME"}</div>
                      </div>
                      <div>
                        <div className="card-label">Expires</div>
                        <div className="card-val">{expiry || "MM/YY"}</div>
                      </div>
                    </div>
                  </div>

                  {/* Back Face */}
                  <div className="card-face card-face-back">
                    <div className="card-magnetic-strip"></div>
                    <div className="card-cvv-area">
                      <div className="card-label" style={{ textAlign: "right", paddingRight: "10px" }}>CVV</div>
                      <div className="card-signature-strip">
                        {cvv || "•••"}
                      </div>
                    </div>
                    <div style={{ padding: "0 1.5rem", fontSize: "0.55rem", color: "rgba(255,255,255,0.4)" }}>
                      *This is a simulated payment screen for secure sandbox demonstration. Do not enter actual credit card details.
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Summary Box */}
              <div style={{ background: "rgba(0, 0, 0, 0.25)", border: "1px solid var(--glass-border)", borderRadius: "12px", padding: "1.2rem", width: "100%" }}>
                <h4 style={{ margin: "0 0 0.8rem 0", borderBottom: "1px solid var(--glass-border)", paddingBottom: "0.5rem", fontSize: "1rem" }}>
                  <i className="fas fa-file-invoice" style={{ marginRight: "6px" }}></i>
                  Order Summary
                </h4>
                <div className="small mb-1 flex-between">
                  <span className="text-muted">Cylinder Type:</span>
                  <span className="text-bright" style={{ fontWeight: "600" }}>{booking?.cylinderType}</span>
                </div>
                <div className="small mb-1 flex-between">
                  <span className="text-muted">Quantity:</span>
                  <span className="text-bright" style={{ fontWeight: "600" }}>{booking?.extra ? "2 Cylinders (Extra)" : "1 Cylinder"}</span>
                </div>
                <div className="small mb-1 flex-between">
                  <span className="text-muted">Delivery Address:</span>
                  <span className="text-bright" style={{ fontWeight: "500", maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={booking?.address}>
                    {booking?.address}
                  </span>
                </div>
                <div className="small mb-2 flex-between">
                  <span className="text-muted">Delivery Date:</span>
                  <span className="text-bright" style={{ fontWeight: "600" }}>{booking?.date}</span>
                </div>
                <div className="flex-between" style={{ borderTop: "1px solid var(--glass-border)", paddingTop: "0.6rem", fontWeight: "700" }}>
                  <span>Total Amount:</span>
                  <span style={{ color: "#38ef7d", fontSize: "1.1rem" }}>₹{price}</span>
                </div>
              </div>

              <Link to="/client-dashboard" className="text-muted small" style={{ textDecoration: "none" }}>
                <i className="fas fa-xmark" style={{ marginRight: "4px" }}></i> Cancel & Exit Checkout
              </Link>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

export default PaymentPage;
