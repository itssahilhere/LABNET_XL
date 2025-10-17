import User from '../models/User.model';

export class AdminDashboardService {
  // Get dashboard statistics
  async getDashboardStats() {
    const [
      totalUsers,
      pendingUsers,
      approvedUsers,
      rejectedUsers,
      totalAdmins,
      usersWithFiles,
      recentUsers,
    ] = await Promise.all([
      // Total users (excluding admins)
      User.countDocuments({ role: 'user' }),

      // Pending users
      User.countDocuments({ approval_status: 'pending', role: 'user' }),

      // Approved users
      User.countDocuments({ approval_status: 'approved', role: 'user' }),

      // Rejected users
      User.countDocuments({ approval_status: 'rejected', role: 'user' }),

      // Total admins
      User.countDocuments({ role: 'admin' }),

      // Users with ID proof files
      User.countDocuments({
        id_proof: { $exists: true, $ne: '' },
        role: 'user',
      }),

      // Recent users (last 7 days)
      User.find({
        role: 'user',
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      })
        .select('name email approval_status createdAt')
        .sort({ createdAt: -1 })
        .limit(10),
    ]);

    // Calculate percentages
    const approvalRate = totalUsers > 0 ? Math.round((approvedUsers / totalUsers) * 100) : 0;
    const fileUploadRate = totalUsers > 0 ? Math.round((usersWithFiles / totalUsers) * 100) : 0;

    return {
      overview: {
        totalUsers,
        totalAdmins,
        pendingUsers,
        approvedUsers,
        rejectedUsers,
        usersWithFiles,
      },
      metrics: {
        approvalRate: `${approvalRate}%`,
        fileUploadRate: `${fileUploadRate}%`,
        pendingPercentage: totalUsers > 0 ? Math.round((pendingUsers / totalUsers) * 100) : 0,
      },
      recentActivity: {
        recentUsers: recentUsers.map(user => ({
          _id: user._id,
          name: user.name,
          email: user.email,
          approval_status: user.approval_status,
          createdAt: user.createdAt,
        })),
        newUsersThisWeek: recentUsers.length,
      },
    };
  }

  // Get monthly user registration stats
  async getMonthlyStats() {
    const currentYear = new Date().getFullYear();
    const monthlyStats = [];

    for (let month = 0; month < 12; month++) {
      const startDate = new Date(currentYear, month, 1);
      const endDate = new Date(currentYear, month + 1, 0);

      const [registered, approved, rejected] = await Promise.all([
        User.countDocuments({
          role: 'user',
          createdAt: { $gte: startDate, $lte: endDate },
        }),
        User.countDocuments({
          role: 'user',
          approval_status: 'approved',
          approved_at: { $gte: startDate, $lte: endDate },
        }),
        User.countDocuments({
          role: 'user',
          approval_status: 'rejected',
          approved_at: { $gte: startDate, $lte: endDate },
        }),
      ]);

      monthlyStats.push({
        month: startDate.toLocaleString('default', { month: 'long' }),
        registered,
        approved,
        rejected,
      });
    }

    return monthlyStats;
  }
}
