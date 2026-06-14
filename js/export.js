function downloadBlob(content,filename,type){const blob=new Blob([content],{type}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=filename; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
function safeName(s){return String(s||'project').replace(/[^a-zа-я0-9_-]+/gi,'_').slice(0,80)}
function downloadTemplate(){
const briefRows=[['Раздел','Вопрос','Ответ']]; BRIEF_SECTIONS.forEach(sec=>sec.questions.forEach(q=>briefRows.push([sec.title,q.text,''])));
const wbData={
'Проект':[['Поле','Значение'],['Название проекта',''],['Ниша',''],['Гео',''],['Сайт/соцсети',''],['Бюджет в неделю',''],['Цель рекламы',''],['Ответственный',''],['Статус','Бриф']],
'Бриф':briefRows,
'Услуги':[['Услуга','Спрос','Предложение','Средний чек','Маржа %','Приоритет клиента 1-5','Сезонность','Готовность материалов 1-5'],['','','','','','','','']],
'Спрос и конкуренция':[['Услуга','Город','Спрос','Предложение','Стоимость публикации','Платные услуги'],['','','','','','']],
'Конкуренты':[['Конкурент','Ссылка','Количество объявлений','УТП','Отзывы','Заголовки','Цены','Фото','Оформление','Тексты'],['','','','','','','','','','']],
'ЦА':[['Поле','Значение'],['Портрет ЦА',''],['Боли',''],['Страхи',''],['Возражения',''],['Критерии выбора','']],
'Продажи':[['Поле','Значение'],['Средняя продолжительность сделки',''],['Кто обрабатывает заявки',''],['Скорость ответа',''],['CRM',''],['Скрипты','']],
'Материалы':[['Материал','Есть/нет/ссылка'],['Фото',''],['Видео',''],['Отзывы',''],['Логотип',''],['Брендбук',''],['Прайс','']],
'KPI':[['Показатель','Значение'],['Бюджет в неделю',''],['Желаемые заказы в неделю',''],['Желаемый CPL',''],['Конверсия лид → продажа, %',''],['Средний чек',''],['Маржа, %','']]
};
if(window.XLSX){const wb=XLSX.utils.book_new(); Object.entries(wbData).forEach(([name,rows])=>XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(rows),name)); XLSX.writeFile(wb,'agency_brief_system_template.xlsx');}
else {downloadBlob(briefRows.map(r=>r.map(x=>'"'+String(x).replace(/"/g,'""')+'"').join(',')).join('\n'),'agency_brief_system_template.csv','text/csv;charset=utf-8')}
}
