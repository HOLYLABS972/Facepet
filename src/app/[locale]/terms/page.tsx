'use client';

import { motion } from 'motion/react';
import { FileText, Calendar, Shield, AlertTriangle } from 'lucide-react';
import Footer from '@/src/components/layout/Footer';

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center">
            <h1 className="text-2xl font-bold text-gray-900">Terms of Service</h1>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-orange-500 to-red-500 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-3 mb-4"
          >
            <FileText className="h-8 w-8" />
            <h2 className="text-4xl font-bold">Terms of Service</h2>
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl opacity-90 max-w-2xl mx-auto"
          >
            Please read these terms carefully before using FacePet services.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-center gap-2 mt-4 text-orange-200"
          >
            <Calendar className="h-4 w-4" />
            <span>Last updated: {new Date().toLocaleDateString()}</span>
          </motion.div>
        </div>
      </div>

      {/* Terms Content */}
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
                Welcome to FacePet! These Terms of Service ("Terms") govern your use of our pet identification 
                and safety platform. By accessing or using our services, you agree to be bound by these Terms.
              </p>
            </section>

            {/* Acceptance of Terms */}
            <section>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">2. Acceptance of Terms</h3>
              <p className="text-gray-600 leading-relaxed">
                By creating an account, purchasing our NFC chips, or using our platform, you acknowledge that 
                you have read, understood, and agree to be bound by these Terms and our Privacy Policy.
              </p>
            </section>

            {/* Description of Service */}
            <section>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">3. Description of Service</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                FacePet provides NFC-based pet identification services that allow pet owners to:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Create digital profiles for their pets</li>
                <li>Store contact information and medical details</li>
                <li>Enable others to scan NFC chips to access pet information</li>
                <li>Facilitate pet recovery in case of loss</li>
              </ul>
            </section>

            {/* User Responsibilities */}
            <section>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">4. User Responsibilities</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-orange-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Accurate Information</h4>
                    <p className="text-gray-600">
                      You must provide accurate and up-to-date information about yourself and your pets.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-orange-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Account Security</h4>
                    <p className="text-gray-600">
                      You are responsible for maintaining the security of your account credentials.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-orange-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Proper Use</h4>
                    <p className="text-gray-600">
                      You agree to use our services only for lawful purposes and in accordance with these Terms.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Privacy and Data */}
            <section>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">5. Privacy and Data Protection</h3>
              <p className="text-gray-600 leading-relaxed">
                We are committed to protecting your privacy and your pet's information. Our collection, 
                use, and protection of personal data is governed by our Privacy Policy, which is 
                incorporated into these Terms by reference.
              </p>
            </section>

            {/* Prohibited Uses */}
            <section>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">6. Prohibited Uses</h3>
              <div className="flex items-start gap-3 mb-4">
                <AlertTriangle className="h-5 w-5 text-red-500 mt-1 flex-shrink-0" />
                <p className="text-gray-600">
                  You may not use our services for any unlawful purpose or to solicit others to perform unlawful acts.
                </p>
              </div>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Violate any applicable laws or regulations</li>
                <li>Transmit harmful or malicious code</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Use the service to harass, abuse, or harm others</li>
                <li>Impersonate another person or entity</li>
              </ul>
            </section>

            {/* Intellectual Property */}
            <section>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">7. Intellectual Property</h3>
              <p className="text-gray-600 leading-relaxed">
                The FacePet platform, including its design, functionality, and content, is protected by 
                intellectual property laws. You may not copy, modify, or distribute our proprietary 
                materials without written permission.
              </p>
            </section>

            {/* Limitation of Liability */}
            <section>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">8. Limitation of Liability</h3>
              <p className="text-gray-600 leading-relaxed">
                FacePet provides its services "as is" without warranties of any kind. We are not liable 
                for any indirect, incidental, or consequential damages arising from your use of our services.
              </p>
            </section>

            {/* Termination */}
            <section>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">9. Termination</h3>
              <p className="text-gray-600 leading-relaxed">
                We reserve the right to terminate or suspend your account at any time for violation of 
                these Terms or for any other reason at our sole discretion.
              </p>
            </section>

            {/* Changes to Terms */}
            <section>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">10. Changes to Terms</h3>
              <p className="text-gray-600 leading-relaxed">
                We may update these Terms from time to time. We will notify users of significant changes 
                via email or through our platform. Continued use of our services after changes constitutes 
                acceptance of the new Terms.
              </p>
            </section>

            {/* Contact Information */}
            <section className="border-t pt-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">11. Contact Information</h3>
              <p className="text-gray-600 leading-relaxed">
                If you have any questions about these Terms, please contact us at:
              </p>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700">
                  <strong>Email:</strong> legal@facepet.com<br />
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
  );
}
