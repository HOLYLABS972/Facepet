'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'motion/react';
import { Mail, Phone, MapPin, Send, CheckCircle, Facebook, Instagram, MessageCircle } from 'lucide-react';
import Footer from '@/src/components/layout/Footer';
import { useTranslations } from 'next-intl';
import { createContactSubmission } from '@/src/lib/firebase/contact';
import { getContactInfo } from '@/lib/actions/admin';
import { useAuth } from '@/src/contexts/AuthContext';
import { getUserFromFirestore } from '@/src/lib/firebase/users';

export default function ContactPage() {
  const t = useTranslations('pages.ContactPage');
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [contactInfo, setContactInfo] = useState({
    email: 'support@facepet.com',
    phone: '+1 (555) 123-4567',
    address: '123 Pet Street\nAnimal City, AC 12345\nUnited States',
    facebook: '',
    instagram: '',
    whatsapp: ''
  });
  const [isLoadingContactInfo, setIsLoadingContactInfo] = useState(true);

  useEffect(() => {
    const fetchContactInfo = async () => {
      try {
        const info = await getContactInfo();
        if (info) {
          setContactInfo({
            email: info.email || 'support@facepet.com',
            phone: info.phone || '+1 (555) 123-4567',
            address: info.address || '123 Pet Street\nAnimal City, AC 12345\nUnited States',
            facebook: info.facebook || '',
            instagram: info.instagram || '',
            whatsapp: info.whatsapp || ''
          });
        }
      } catch (error) {
        console.error('Failed to fetch contact info:', error);
      } finally {
        setIsLoadingContactInfo(false);
      }
    };

    fetchContactInfo();
  }, []);

  // Prefill form with user data if authenticated
  useEffect(() => {
    if (user) {
      const loadUserData = async () => {
        try {
          // Try to get user data from Firestore first
          const userResult = await getUserFromFirestore(user.uid);
          
          if (userResult.success && userResult.user) {
            // Use Firestore data if available
            setFormData(prev => ({
              ...prev,
              name: user.displayName || userResult.user?.displayName || '',
              email: user.email || '',
              phone: userResult.user?.phone || ''
            }));
          } else {
            // Fallback to Firebase Auth data
            setFormData(prev => ({
              ...prev,
              name: user.displayName || '',
              email: user.email || ''
            }));
          }
        } catch (error) {
          console.error('Error loading user data for contact form:', error);
          // Fallback to basic data
          setFormData(prev => ({
            ...prev,
            name: user.displayName || '',
            email: user.email || ''
          }));
        }
      };

      loadUserData();
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      const submission = await createContactSubmission(formData);
      
      if (submission) {
        setSubmitStatus('success');
        setFormData({
          name: '',
          email: '',
          phone: '',
          message: ''
        });
      } else {
        setSubmitStatus('error');
        setErrorMessage('Failed to submit contact form');
      }
    } catch (error) {
      console.error('Contact form submission error:', error);
      setSubmitStatus('error');
      setErrorMessage('Failed to submit contact form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center">
            <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
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
            {t('heroTitle')}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl opacity-90 max-w-2xl mx-auto"
          >
            {t('heroDescription')}
          </motion.p>
        </div>
      </div>

      {/* Contact Form and Info */}
      <div className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="h-5 w-5" />
                    {t('formTitle')}
                  </CardTitle>
                  <CardDescription>
                    {t('formDescription')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">{t('form.name')} *</Label>
                        <Input
                          id="name"
                          name="name"
                          type="text"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                          placeholder={t('form.namePlaceholder')}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">{t('form.email')} *</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                          placeholder={t('form.emailPlaceholder')}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">{t('form.phone')}</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder={t('form.phonePlaceholder')}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">{t('form.message')} *</Label>
                      <Textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        required
                        placeholder={t('form.messagePlaceholder')}
                        rows={6}
                      />
                    </div>

                    {submitStatus === 'success' && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg"
                      >
                        <CheckCircle className="h-5 w-5" />
                        <span>{t('form.successMessage')}</span>
                      </motion.div>
                    )}

                    {submitStatus === 'error' && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-600 bg-red-50 p-3 rounded-lg"
                      >
                        {errorMessage}
                      </motion.div>
                    )}

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                    >
                      {isSubmitting ? t('form.sending') : t('form.sendButton')}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>

            {/* Contact Information */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-8"
            >
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">{t('contactInfo.title')}</h3>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-orange-100 p-3 rounded-full">
                      <Mail className="h-6 w-6 text-orange-500" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{t('contactInfo.email')}</h4>
                      <p className="text-gray-600">{isLoadingContactInfo ? 'Loading...' : contactInfo.email}</p>
                      <p className="text-sm text-gray-500">{t('contactInfo.emailResponse')}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="bg-orange-100 p-3 rounded-full">
                      <Phone className="h-6 w-6 text-orange-500" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{t('contactInfo.phone')}</h4>
                      <p className="text-gray-600">{isLoadingContactInfo ? 'Loading...' : contactInfo.phone}</p>
                      <p className="text-sm text-gray-500">{t('contactInfo.phoneHours')}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="bg-orange-100 p-3 rounded-full">
                      <MapPin className="h-6 w-6 text-orange-500" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{t('contactInfo.address')}</h4>
                      <p className="text-gray-600">
                        {isLoadingContactInfo ? 'Loading...' : contactInfo.address.split('\n').map((line, index) => (
                          <span key={index}>
                            {line}
                            {index < contactInfo.address.split('\n').length - 1 && <br />}
                          </span>
                        ))}
                      </p>
                    </div>
                  </div>

                  {/* Social Media Links */}
                  {(contactInfo.facebook || contactInfo.instagram || contactInfo.whatsapp) && (
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900">{t('contactInfo.followUs')}</h4>
                      <div className="flex flex-wrap gap-4">
                        {contactInfo.facebook && (
                          <a 
                            href={contactInfo.facebook} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
                          >
                            <Facebook className="h-5 w-5" />
                            Facebook
                          </a>
                        )}
                        {contactInfo.instagram && (
                          <a 
                            href={contactInfo.instagram} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-pink-600 hover:text-pink-700 transition-colors"
                          >
                            <Instagram className="h-5 w-5" />
                            Instagram
                          </a>
                        )}
                        {contactInfo.whatsapp && (
                          <a 
                            href={contactInfo.whatsapp} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-green-600 hover:text-green-700 transition-colors"
                          >
                            <MessageCircle className="h-5 w-5" />
                            WhatsApp
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>{t('faq.title')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900">{t('faq.question1')}</h4>
                    <p className="text-sm text-gray-600">
                      {t('faq.answer1')}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{t('faq.question2')}</h4>
                    <p className="text-sm text-gray-600">
                      {t('faq.answer2')}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{t('faq.question3')}</h4>
                    <p className="text-sm text-gray-600">
                      {t('faq.answer3')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
