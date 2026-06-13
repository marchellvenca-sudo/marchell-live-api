const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
app.use(cors());

// دالة ذكية لتنظيف النصوص المستخرجة من الجداول
const cleanText = (text) => text ? text.replace(/\s+/g, ' ').trim() : '';

// مسار رئيسي لعرض حالة السيرفر وتجنب رسالة Cannot GET /
app.get('/', (req, res) => {
    res.send('🚀 Marchell Live API Server is Running Successfully!');
});

// تم تعديل المسار هنا ليصبح /api/news ليطابق طلب الواجهة تماماً
app.get('/api/news', async (req, res) => {
    try {
        // جلب صفحة المفكرة الاقتصادية مباشرة من موقع Forex Factory
        const response = await axios.get('https://www.forexfactory.com/calendar', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9'
            }
        });

        const $ = cheerio.load(response.data);
        const events = [];
        let currentStaticDate = '';

        // قشط صفوف الجدول بدقة عالية بناءً على بنية الموقع الحية
        $('tr.calendar__row').each((index, element) => {
            const row = $(element);
            
            // استخراج التاريخ إذا كان موجوداً في الصف (لأن بعض الصفوف تشترك في نفس التاريخ)
            const dateText = cleanText(row.find('.calendar__date').text());
            if (dateText) {
                currentStaticDate = dateText;
            }

            const time = cleanText(row.find('.calendar__time').text());
            const currency = cleanText(row.find('.calendar__currency').text());
            const impactIcon = row.find('.calendar__impact span');
            const title = cleanText(row.find('.calendar__event span').text());
            const actual = cleanText(row.find('.calendar__actual').text());
            const forecast = cleanText(row.find('.calendar__forecast').text());
            const previous = cleanText(row.find('.calendar__previous').text());

            // تحديد مدى قوة الخبر (High Impact فقط) وللعملة الأمريكية USD فقط كما طلبت في منصتك
            let isHighImpact = false;
            if (impactIcon.hasClass('icon--impact-red') || impactIcon.attr('class')?.includes('red')) {
                isHighImpact = true;
            }

            if (currency === 'USD' && isHighImpact && title) {
                events.push({
                    title: title,
                    country: currency, // تم تغيير المفتاح إلى country ليتوافق مع فلتر الواجهة (event.country === 'USD')
                    impact: 'High',    // تم إرجاع قيمة نصية واضحة لتتوافق مع فلتر الواجهة (event.impact === 'High')
                    date: currentStaticDate,
                    time: time,
                    actual: actual,
                    forecast: forecast,
                    previous: previous
                });
            }
        });

        // إرسال البيانات الصافية والمحدثة فوراً بالثانية للموقع
        res.json(events);

    } catch (error) {
        console.error("Error scraping data:", error.message);
        res.status(500).json({ error: "Failed to fetch live market data from source" });
    }
});

// تشغيل السيرفر على المنفذ المخصص للاستضافة السحابية
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Marchell Server is blazing fast on port ${PORT}`);
});