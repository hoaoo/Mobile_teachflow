import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiClient, ApiError, type ChatAIMessage } from '@/api/client';
import { Colors, Radius, Spacing } from '@/theme';

const SUGGESTED_PROMPTS = [
  'Gợi ý 3 trò chơi khởi động môn Toán lớp 3',
  'Phương pháp rèn kỹ năng đọc diễn cảm cho học sinh lớp 2',
  'Cách tổ chức thảo luận nhóm môn Tự nhiên và Xã hội',
  'Gợi ý nhận xét tích cực động viên học sinh còn rụt rè',
];

export default function AiChatScreen() {
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);

  const [messages, setMessages] = useState<ChatAIMessage[]>([
    {
      role: 'assistant',
      content:
        'Xin chào Thầy/Cô! Tôi là Trợ lý Sư phạm TeachFlow. Thầy/Cô cần hỗ trợ phương pháp giảng dạy, thiết kế hoạt động hay xử lý tình huống lớp học nào hôm nay?',
      createdAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // Dynamic keyboard listeners for clean bottom safe-area transitions
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => {
      setIsKeyboardVisible(true);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 150);
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleSend = async (customText?: string) => {
    const textToSend = (customText || inputText).trim();
    if (!textToSend || isLoading) return;

    Keyboard.dismiss();
    setInputText('');
    setErrorMessage(null);

    const userMsg: ChatAIMessage = {
      role: 'user',
      content: textToSend,
      createdAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsLoading(true);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const historyContext = newMessages
        .slice(-6)
        .map((m) => `${m.role === 'user' ? 'Giáo viên' : 'Trợ lý'}: ${m.content}`)
        .join('\n');

      const res = await apiClient.chatAI({
        message: textToSend,
        history: historyContext,
      });

      const assistantMsg: ChatAIMessage = {
        role: 'assistant',
        content: res.reply || res.content || 'Tôi đã tiếp nhận câu hỏi của Thầy/Cô.',
        createdAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.statusCode === 429) {
          setErrorMessage('Hệ thống đang quá tải yêu cầu. Vui lòng đợi trong giây lát.');
        } else {
          setErrorMessage(err.message);
        }
      } else {
        setErrorMessage('Dịch vụ AI hiện không phản hồi. Vui lòng thử lại sau.');
      }
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 44 : 0}>
      <StatusBar style="dark" />

      {/* Conversation Feed */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesScroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => {
          scrollViewRef.current?.scrollToEnd({ animated: false });
        }}>
        {/* Suggested Prompts if only 1 welcome message */}
        {messages.length === 1 && (
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsTitle}>💡 GỢI Ý CÂU HỎI NHANH</Text>
            {SUGGESTED_PROMPTS.map((prompt, idx) => (
              <Pressable
                key={idx}
                style={({ pressed }) => [
                  styles.promptChip,
                  pressed && styles.promptChipPressed,
                ]}
                onPress={() => handleSend(prompt)}>
                <Text style={styles.promptChipText}>{prompt}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Message Feed */}
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          return (
            <View
              key={index}
              style={[
                styles.messageRow,
                isUser ? styles.messageRowUser : styles.messageRowAssistant,
              ]}>
              {!isUser && (
                <View style={styles.avatarMini}>
                  <Text style={styles.avatarMiniText}>✨</Text>
                </View>
              )}
              <View
                style={[
                  styles.bubble,
                  isUser ? styles.bubbleUser : styles.bubbleAssistant,
                ]}>
                <Text
                  style={[
                    styles.bubbleText,
                    isUser ? styles.bubbleTextUser : styles.bubbleTextAssistant,
                  ]}>
                  {msg.content}
                </Text>
                {msg.createdAt && (
                  <Text
                    style={[
                      styles.timestampText,
                      isUser ? styles.timestampUser : styles.timestampAssistant,
                    ]}>
                    {msg.createdAt}
                  </Text>
                )}
              </View>
            </View>
          );
        })}

        {/* Generating Indicator */}
        {isLoading && (
          <View style={[styles.messageRow, styles.messageRowAssistant]}>
            <View style={styles.avatarMini}>
              <Text style={styles.avatarMiniText}>✨</Text>
            </View>
            <View style={[styles.bubble, styles.bubbleAssistant, styles.loadingBubble]}>
              <ActivityIndicator color={Colors.primary} size="small" />
              <Text style={styles.loadingText}>Trợ lý AI đang soạn câu trả lời...</Text>
            </View>
          </View>
        )}

        {/* Error Container */}
        {errorMessage && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
          </View>
        )}
      </ScrollView>

      {/* Input Bar */}
      <View
        style={[
          styles.inputBar,
          {
            paddingBottom: isKeyboardVisible
              ? Spacing.sm
              : Math.max(insets.bottom, Spacing.sm),
          },
        ]}>
        <TextInput
          style={styles.textInput}
          placeholder="Nhập câu hỏi sư phạm hoặc tình huống..."
          placeholderTextColor={Colors.textMuted}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={1000}
          textAlignVertical="top"
          editable={!isLoading}
        />
        <Pressable
          style={({ pressed }) => [
            styles.sendBtn,
            (!inputText.trim() || isLoading) && styles.sendBtnDisabled,
            pressed && styles.sendBtnPressed,
          ]}
          onPress={() => handleSend()}
          disabled={!inputText.trim() || isLoading}>
          {isLoading ? (
            <ActivityIndicator color={Colors.textWhite} size="small" />
          ) : (
            <Text style={styles.sendBtnText}>Gửi</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  messagesScroll: {
    flex: 1,
    minHeight: 0,
  },
  scrollContent: {
    flexGrow: 1,
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
  },
  suggestionsContainer: {
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  suggestionsTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  promptChip: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  promptChipPressed: {
    backgroundColor: Colors.surfaceMuted,
  },
  promptChipText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageRowAssistant: {
    justifyContent: 'flex-start',
  },
  avatarMini: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  avatarMiniText: {
    fontSize: 14,
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  bubbleUser: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: Radius.xs,
  },
  bubbleAssistant: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderBottomLeftRadius: Radius.xs,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  bubbleTextUser: {
    color: Colors.textWhite,
  },
  bubbleTextAssistant: {
    color: Colors.textPrimary,
  },
  timestampText: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  timestampUser: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  timestampAssistant: {
    color: Colors.textMuted,
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  loadingText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  errorBox: {
    backgroundColor: Colors.dangerBg,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.dangerBorder,
  },
  errorText: {
    fontSize: 12,
    color: Colors.danger,
    lineHeight: 16,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.sm,
  },
  textInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingTop: Platform.OS === 'ios' ? 10 : 8,
    paddingBottom: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  sendBtn: {
    minHeight: 44,
    minWidth: 54,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: Colors.textMuted,
    opacity: 0.6,
  },
  sendBtnPressed: {
    opacity: 0.85,
  },
  sendBtnText: {
    color: Colors.textWhite,
    fontSize: 14,
    fontWeight: '700',
  },
});
