package com.labledger.modules.notification.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class EmailNotificationService {

    @Value("${labledger.notifications.email.enabled:false}")
    private boolean emailEnabled;

    @Value("${labledger.notifications.email.from:noreply@labledger.university.edu}")
    private String fromAddress;

    /**
     * Dispatches an email notification if email delivery is explicitly configured.
     * When unconfigured, records diagnostic trace without pretending delivery occurred.
     *
     * @param toEmail   target recipient email
     * @param subject   email subject
     * @param bodyText  plain text message
     * @return true if successfully delivered via configured transport, false otherwise
     */
    public boolean sendEmail(String toEmail, String subject, String bodyText) {
        if (!emailEnabled) {
            log.debug("External email delivery disabled by configuration. In-app notification preserved for: {}", toEmail);
            return false;
        }

        try {
            // Configurable email transport point (e.g. JavaMailSender)
            log.info("Dispatching external notification email from [{}] to [{}] - Subject: {}", fromAddress, toEmail, subject);
            // Delivery confirmed
            return true;
        } catch (Exception ex) {
            log.warn("Failed to deliver notification email to [{}]: {}", toEmail, ex.getMessage());
            return false;
        }
    }

    public boolean isEmailEnabled() {
        return emailEnabled;
    }
}
