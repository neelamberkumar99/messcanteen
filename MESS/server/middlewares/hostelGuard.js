// Middleware to ensure admin-level users operate only on their assigned hostel
module.exports = (req, res, next) => {
  try {
    const userHostel = req.user && req.user.profile && req.user.profile.hostelId;
    const bodyHostel = req.body && req.body.hostelId;
    const paramHostel = req.params && req.params.hostelId;
    const queryHostel = req.query && req.query.hostelId;

    const targetHostel = bodyHostel || paramHostel || queryHostel;

    if (!targetHostel) return res.status(400).json({ success: false, message: 'hostelId is required' });

    if (!userHostel) return res.status(403).json({ success: false, message: 'Access denied: user has no hostel assigned' });

    if (String(userHostel) !== String(targetHostel)) {
      return res.status(403).json({ success: false, message: 'Access denied: not your hostel' });
    }

    return next();
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Hostel guard error' });
  }
};
