export const checkRole = (roles) => {

  return (req, res, next) => {

    if (!roles.includes(req.session.user.role)) {

      return res.status(403).json({
        message: "Access denied"
      });

    }

    next();

  };

};