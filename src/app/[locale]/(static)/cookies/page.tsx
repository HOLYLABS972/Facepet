'use client';

import { motion } from 'motion/react';
import { Cookie, Calendar, Shield, Settings } from 'lucide-react';
import Footer from '@/src/components/layout/Footer';
import Navbar from '@/src/components/layout/Navbar';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

export default function CookiesPage() {
  const t = useTranslations('pages.CookiesPage');
  return (
    <>
      {/* Navbar - completely outside all containers */}
      <Navbar />
      
      <div className="min-h-screen bg-gray-50 pt-16">
        {/* Traffic Light Image */}
        <div className="flex justify-center py-4 bg-white">
          <Image 
            src="/traffic_light.svg" 
            alt="Traffic Light" 
            width={100} 
            height={200}
            className="object-contain"
          />
        </div>
        
        <div className="flex flex-col">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-orange-500 to-red-500 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-3 mb-4"
          >
            <Cookie className="h-8 w-8" />
            <h2 className="text-4xl font-bold">Cookie Policy</h2>
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl opacity-90 max-w-2xl mx-auto"
          >
            Learn about how we use cookies and similar technologies on Chapiz
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-center gap-2 mt-4 text-orange-200"
          >
            <Calendar className="h-4 w-4" />
            <span>Last Updated: {new Date().toLocaleDateString('en-GB')}</span>
          </motion.div>
        </div>
      </div>

      {/* Cookies Content */}
      <div className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow-lg p-8 space-y-8"
          >
            {/* Introduction */}
            <section>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">1. What Are Cookies?</h3>
              <p className="text-gray-600 leading-relaxed">
                Cookies are small text files that are placed on your device when you visit a website. 
                They are widely used to make websites work more efficiently and provide information to 
                the website owners. Chapiz uses cookies to enhance your experience and provide 
                personalized services.
              </p>
            </section>

            {/* Types of Cookies */}
            <section>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">2. Types of Cookies We Use</h3>
              
              <div className="space-y-6">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-orange-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Necessary Cookies</h4>
                    <p className="text-gray-600">
                      These cookies are essential for the website to function properly. They enable core 
                      functionality such as security, network management, and accessibility. You cannot 
                      opt out of these cookies as they are necessary for the service to work.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Settings className="h-5 w-5 text-blue-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Analytics Cookies</h4>
                    <p className="text-gray-600">
                      These cookies help us understand how visitors interact with our website by collecting 
                      and reporting information anonymously. This helps us improve our website's performance 
                      and user experience.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Cookie className="h-5 w-5 text-purple-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Marketing Cookies</h4>
                    <p className="text-gray-600">
                      These cookies are used to track visitors across websites to display relevant 
                      advertisements. They help us measure the effectiveness of our marketing campaigns 
                      and personalize your experience.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* How We Use Cookies */}
            <section>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">3. How We Use Cookies</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                We use cookies for the following purposes:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>To remember your preferences and settings</li>
                <li>To keep you logged in to your account</li>
                <li>To analyze website traffic and usage patterns</li>
                <li>To improve website functionality and performance</li>
                <li>To provide personalized content and recommendations</li>
                <li>To measure the effectiveness of our marketing efforts</li>
              </ul>
            </section>

            {/* Managing Cookies */}
            <section>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">4. Managing Your Cookie Preferences</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                You have control over cookies. You can:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Accept or reject cookies through our cookie consent banner</li>
                <li>Change your cookie preferences at any time in your account settings</li>
                <li>Configure your browser to block or delete cookies</li>
                <li>Use browser extensions to manage cookies</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mt-4">
                Please note that blocking or deleting cookies may affect your ability to use certain 
                features of our website.
              </p>
            </section>

            {/* Third-Party Cookies */}
            <section>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">5. Third-Party Cookies</h3>
              <p className="text-gray-600 leading-relaxed">
                Some cookies on our website are set by third-party services, such as analytics providers 
                and advertising networks. These cookies are subject to the respective third parties' 
                privacy policies. We do not control these cookies, and you should review the third-party 
                privacy policies for more information.
              </p>
            </section>

            {/* Cookie Duration */}
            <section>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">6. Cookie Duration</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Cookies can be either session cookies or persistent cookies:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li><strong>Session Cookies:</strong> These are temporary cookies that are deleted when 
                you close your browser. They help maintain your session while you navigate our website.</li>
                <li><strong>Persistent Cookies:</strong> These cookies remain on your device for a set 
                period or until you delete them. They remember your preferences and settings for future visits.</li>
              </ul>
            </section>

            {/* Updates to Policy */}
            <section>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">7. Updates to This Cookie Policy</h3>
              <p className="text-gray-600 leading-relaxed">
                We may update this Cookie Policy from time to time to reflect changes in our practices 
                or for other operational, legal, or regulatory reasons. We will notify you of any material 
                changes by posting the updated policy on this page with a new "Last Updated" date.
              </p>
            </section>

            {/* Contact Information */}
            <section className="border-t pt-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">8. Contact Us</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                If you have any questions about our use of cookies or this Cookie Policy, please contact us:
              </p>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700">
                  <strong>Email:</strong> privacy@facepet.com<br />
                  <strong>General Contact:</strong> support@facepet.com<br />
                  <strong>Address:</strong> 123 Pet Street, Animal City, AC 12345, United States
                </p>
              </div>
            </section>
          </motion.div>
        </div>
      </div>

        {/* Footer */}
        <Footer />
      </div>
    </div>
    </>
  );
}

