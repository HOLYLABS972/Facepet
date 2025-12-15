'use client';

import { motion } from 'motion/react';
import { Shield, Eye, Lock, Database, UserCheck, Mail } from 'lucide-react';
import Footer from '@/src/components/layout/Footer';
import Navbar from '@/src/components/layout/Navbar';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

export default function PrivacyPage() {
  const t = useTranslations('pages.PrivacyPage');
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
            <Shield className="h-8 w-8" />
            <h2 className="text-4xl font-bold">{t('title')}</h2>
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl opacity-90 max-w-2xl mx-auto"
          >
            {t('heroDescription')}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-center gap-2 mt-4 text-orange-200"
          >
            <Eye className="h-4 w-4" />
            <span>{t('lastUpdated')}: {new Date().toLocaleDateString('en-GB')}</span>
          </motion.div>
        </div>
      </div>

      {/* Privacy Content */}
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
              <h3 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h3>
              <p className="text-gray-600 leading-relaxed">
                At FacePet, we are committed to protecting your privacy and the privacy of your pet's information. 
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when 
                you use our pet identification platform.
              </p>
            </section>

            {/* Information We Collect */}
            <section>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">2. Information We Collect</h3>
              
              <div className="space-y-6">
                <div className="flex items-start gap-3">
                  <UserCheck className="h-5 w-5 text-orange-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Personal Information</h4>
                    <p className="text-gray-600">
                      When you create an account, we collect your name, email address, phone number, 
                      and home address to provide our services.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Database className="h-5 w-5 text-orange-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Pet Information</h4>
                    <p className="text-gray-600">
                      We store your pet's name, photos, breed, gender, birth date, medical information, 
                      and any notes you choose to include in their profile.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-orange-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Contact Information</h4>
                    <p className="text-gray-600">
                      We collect contact form submissions, support requests, and communication preferences 
                      to provide customer service.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* How We Use Information */}
            <section>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">3. How We Use Your Information</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Provide and maintain our pet identification services</li>
                <li>Enable NFC chip scanning and pet profile access</li>
                <li>Facilitate pet recovery and reunification</li>
                <li>Send important service updates and notifications</li>
                <li>Provide customer support and respond to inquiries</li>
                <li>Improve our platform and develop new features</li>
                <li>Ensure platform security and prevent fraud</li>
              </ul>
            </section>

            {/* Information Sharing */}
            <section>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">4. Information Sharing and Disclosure</h3>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Lock className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Public Pet Profiles</h4>
                    <p className="text-gray-600">
                      Your pet's profile information is accessible to anyone who scans the NFC chip. 
                      This includes your pet's name, photos, and contact information (based on your privacy settings).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-blue-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Privacy Controls</h4>
                    <p className="text-gray-600">
                      You can control which information is public through our privacy settings. 
                      You can choose to keep your phone number, email, or address private while 
                      still allowing people to contact you through our platform.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Database className="h-5 w-5 text-purple-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Service Providers</h4>
                    <p className="text-gray-600">
                      We may share information with trusted third-party service providers who help us 
                      operate our platform, such as hosting services, email providers, and analytics services.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Data Security */}
            <section>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">5. Data Security</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                We implement industry-standard security measures to protect your information:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Encryption of data in transit and at rest</li>
                <li>Secure authentication and access controls</li>
                <li>Regular security audits and updates</li>
                <li>Limited access to personal information on a need-to-know basis</li>
                <li>Secure backup and disaster recovery procedures</li>
              </ul>
            </section>

            {/* Your Rights */}
            <section>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">6. Your Rights and Choices</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                You have the following rights regarding your personal information:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li><strong>Access:</strong> Request a copy of your personal information</li>
                <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your account and data</li>
                <li><strong>Portability:</strong> Export your data in a machine-readable format</li>
                <li><strong>Privacy Settings:</strong> Control what information is publicly accessible</li>
                <li><strong>Communication:</strong> Opt out of marketing communications</li>
              </ul>
            </section>

            {/* Cookies and Tracking */}
            <section>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">7. Cookies and Tracking Technologies</h3>
              <p className="text-gray-600 leading-relaxed">
                We use cookies and similar technologies to enhance your experience, analyze usage patterns, 
                and provide personalized content. You can control cookie preferences through your browser settings.
              </p>
            </section>

            {/* Children's Privacy */}
            <section>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">8. Children's Privacy</h3>
              <p className="text-gray-600 leading-relaxed">
                Our services are not intended for children under 13 years of age. We do not knowingly 
                collect personal information from children under 13. If we become aware that we have 
                collected such information, we will take steps to delete it promptly.
              </p>
            </section>

            {/* International Transfers */}
            <section>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">9. International Data Transfers</h3>
              <p className="text-gray-600 leading-relaxed">
                Your information may be transferred to and processed in countries other than your own. 
                We ensure appropriate safeguards are in place to protect your information in accordance 
                with applicable data protection laws.
              </p>
            </section>

            {/* Changes to Privacy Policy */}
            <section>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">10. Changes to This Privacy Policy</h3>
              <p className="text-gray-600 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any material 
                changes by email or through our platform. Your continued use of our services after such 
                changes constitutes acceptance of the updated Privacy Policy.
              </p>
            </section>

            {/* Contact Information */}
            <section className="border-t pt-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">11. Contact Us</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                If you have any questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700">
                  <strong>Privacy Officer:</strong> privacy@facepet.com<br />
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
