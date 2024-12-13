;; Reputation System Contract

(define-map user-ratings
  { user: principal }
  { total-score: uint, review-count: uint }
)

(define-constant err-invalid-rating (err u100))
(define-constant err-self-rating (err u101))

(define-public (submit-rating (user principal) (rating uint))
  (let
    ((current-rating (default-to { total-score: u0, review-count: u0 } (map-get? user-ratings { user: user }))))
    (asserts! (and (>= rating u1) (<= rating u5)) err-invalid-rating)
    (asserts! (not (is-eq tx-sender user)) err-self-rating)
    (ok (map-set user-ratings
      { user: user }
      {
        total-score: (+ (get total-score current-rating) rating),
        review-count: (+ (get review-count current-rating) u1)
      }
    ))
  )
)

(define-read-only (get-rating (user principal))
  (let
    ((rating (default-to { total-score: u0, review-count: u0 } (map-get? user-ratings { user: user }))))
    (if (is-eq (get review-count rating) u0)
      (ok u0)
      (ok (/ (get total-score rating) (get review-count rating)))
    )
  )
)

(define-read-only (get-review-count (user principal))
  (ok (get review-count (default-to { total-score: u0, review-count: u0 } (map-get? user-ratings { user: user }))))
)

