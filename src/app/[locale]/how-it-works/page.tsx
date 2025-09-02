'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { motion } from 'motion/react';
import { Shield, Smartphone, Users, Heart } from 'lucide-react';
import Footer from '@/src/components/layout/Footer';

export default function HowItWorksPage() {
  const t = useTranslations('pages.HowItWorks');
  const router = useRouter();

  const steps = [
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Attach NFC Chip",
      description: "Securely attach the FacePet NFC chip to your pet's collar or harness."
    },
    {
      icon: <Smartphone className="h-8 w-8" />,
      title: "Create Pet Profile",
      description: "Set up your pet's profile with photos, medical info, and contact details."
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Share with Community",
      description: "Anyone can scan the chip to access your pet's information and contact you."
    },
    {
      icon: <Heart className="h-8 w-8" />,
      title: "Peace of Mind",
      description: "Your pet is protected 24/7 with instant access to vital information."
    }
  ];

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center">
            <h1 className="text-2xl font-bold text-gray-900">How FacePet Works</h1>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-orange-500 to-red-500 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold mb-4"
          >
            Pet Safety, Reinvented
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl opacity-90 max-w-2xl mx-auto"
          >
            FacePet uses NFC technology to keep your pets safe and connected. 
            Here's how our innovative system works.
          </motion.p>
        </div>
      </div>

      {/* How It Works Steps */}
      <div className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-lg p-6 shadow-md text-center"
              >
                <div className="text-orange-500 mb-4 flex justify-center">
                  {step.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">
                  {step.title}
                </h3>
                <p className="text-gray-600">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose FacePet?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our NFC-based system provides instant access to your pet's information, 
              ensuring they're always protected and connected.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-orange-500" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Instant Identification</h3>
              <p className="text-gray-600">
                Anyone can scan the NFC chip to instantly access your pet's profile and contact information.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-orange-500" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Emergency Contact</h3>
              <p className="text-gray-600">
                Quick access to owner and veterinarian contact information in emergency situations.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-orange-500" />
              </div>
              <h3 className="text-xl font-semibold mb-3">No Subscriptions</h3>
              <p className="text-gray-600">
                One-time purchase for lifetime peace of mind. No monthly fees or recurring costs.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-white text-gray-900 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Protect Your Pet?
          </h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of pet owners who trust FacePet to keep their furry friends safe.
          </p>
          <Button
            onClick={() => router.push('/auth')}
            className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-full text-lg font-semibold"
          >
            Get Started Now
          </Button>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
