# ===========================================================================
# config unittest
# Copyright 2004, University of Auckland
#
# This program is free software; you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation; either version 2 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program; if not, write to the Free Software
# Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
# ===========================================================================

import unittest
import pickle
from exe.engine.package import Package
from exe.engine.packagestore import PackageStore, g_packageStore

# ===========================================================================
class TestPackage(unittest.TestCase):
    def setUp(self):
        pass

    def testCreatePackage(self):
        package = g_packageStore.createPackage()
        self.assert_(package)
        self.assert_(package.name)
        
    def testLoadExistingPackage(self, filePath):
        infile = open(filePath)
        package = pickle.load(infile)
        self.assert_(package)
        self.assert_(package.name)
   
if __name__ == "__main__":
    unittest.main()
