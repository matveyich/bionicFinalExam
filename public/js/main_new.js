﻿var tm = {};

tm.init = function(){
    tm.lastRemoteDate = Date.parse('01.01.0001');
    tm.lastLocalDate = Date.parse('01.01.0002');

    tm.Util.renderModeSwitcher();

    tm.Util.rebuildPage();

    tm.tagsMenu = new tm.TagsMenu(tm.curURLObject);
    tm.datesMenu = new tm.DatesMenu(tm.curURLObject);
    tm.Util.renderTodayHeader();

    $('#add-task-btn').after(tm.Util.renderTaskForm());
    $('#add-task-btn').on('click', function(e){
        e.stopPropagation();
        tm.Util.addTaskBtnClick($(this));
    });
    $('#add-task-form').find('.form-save-new-task-button').on('click', function(e){
        e.stopPropagation();
        tm.Util.saveNewTaskBtnClick($(this), tm.curTasksObject);
    });
    $('#add-task-form').find('.form-cancel-new-task-button').on('click', function(e){
        e.stopPropagation();
        tm.Util.clearTaskForm($('#add-task-form'));
        $('#tasks').toggleClass('adding-new-task-mode');
    });
    $('#mode-switcher').on('click', function(e){
        $(this).toggleClass('offline-mode');
        $(this).find('.offline').toggleClass('hidden');
        $(this).find('.online').toggleClass('hidden');
        tm.Util.rebuildPage();
    });
    $('#tag-group').on('click', function(){
        $('#mode-switcher').addClass('minimized');
        $('#tags').toggleClass('minimized');
        $('#dates').addClass('minimized');

    });
    $('#mode').on('click', function(){
        $('#mode-switcher').toggleClass('minimized');
        $('#tags').addClass('minimized');
        $('#dates').addClass('minimized');

    });
    $('#date-group').on('click', function(){
        $('#mode-switcher').addClass('minimized');
        $('#tags').addClass('minimized');
        $('#dates').toggleClass('minimized');

    });
    $('#date').on('click', function(){
        $('#mode-switcher').addClass('minimized');
        $('#tags').addClass('minimized');
        $('#dates').addClass('minimized');
        $('#add-task-btn').toggleClass('minimized');
        $('#tasks').toggleClass('minimized');
    });

}

tm.Util = {
    tasksObjectName: '',

    tagsData: [
        {
            name: "Important",
            counter: 0
        },
        {
            name: "Finished",
            counter: 0
        },
        {
            name: "In-progress",
            counter: 0
        },
        {
            name: "Not-started",
            counter: 0
        },
        {
            name: "Done",
            counter: 0
        }
    ],

    rebuildPage: function() {
        tm.curURLObject = new tm.TasksURL();
        tm.curFilterObject = new tm.TasksFilter();

        tm.Util.activateURL(tm.curFilterObject, tm.curURLObject);

        tm.curTasksObject = new tm.Tasks(tm.curFilterObject, 'tm.tasks', tm.Util.isOfflineMode());
        tm.curTasksObject.loadTasks();

        tm.Util.renderTasksDOMElement(tm.curTasksObject);
        tm.Util.subscribeToEvents();
    },

    renderTodayHeader: function(){
        var day = $('#date').find('.day');
        var date = $('#date').find('.date');
        var today = Date.today();

        day.html(today.getDayName());
        date.html(today.getMonthName()
            + ' '
            + today.getDate()
            + ' '
            + today.getFullYear()
        )
    },

    allTasksDOMElement: function() {
        return $('#tasks');
    },

    clearTasksInDOM: function () {
        tm.Util.allTasksDOMElement().empty();
    },

    editBtnClick: function(editBtn){
        var taskDOMel = editBtn.parents('.task');
        tm.Util.setEditTaskMode($(taskDOMel));
    },

    cancelBtnClick: function(cancelBtn){
        var taskDOMel = cancelBtn.parents('.task');
        tm.Util.cancelTaskEdit(taskDOMel);
    },

    saveBtnClick: function(saveBtn){
        var taskDOMel = saveBtn.parents('.task');
        tm.Util.saveTaskEdit($(taskDOMel));
    },

    delBtnClick: function(delBtn){
        var taskDOMel = delBtn.parents('.task');
        var taskid = delBtn.attr('taskId');
        tm.curTasksObject.deleteTask(taskid);
        $(taskDOMel).remove();
        $('#tasks').children('.task').toggleClass('editing-another-task-mode');
    },

    addTaskBtnClick: function(addBtn){
        $('#add-task-form').toggleClass('hidden');
        $('#tasks').toggleClass('adding-new-task-mode');
    },

    saveNewTaskBtnClick: function(saveBtn, tasksObject) {
        var newTaskForm = saveBtn.parents('.task-form');
        var taskObject = {
            id: tm.Util.generateUID(),
            title: newTaskForm.find('[name=task-title]').val(),
            dueDate: newTaskForm.find('[name=task-due-date]').val(),
            tags: [newTaskForm.find('[name=task-tags]').val()],
            taskBody: newTaskForm.find('[name=task-body]').val(),
            link: ''
        };
        tm.Util.clearTaskForm(newTaskForm);
        tasksObject.addTask(taskObject);
        tm.Util.rebuildPage();
    },

    clearTaskForm: function(form) {
        form.find('[name=task-title]').val('');
        form.find('[name=task-due-date]').val(tm.Util.getNormalDate(new Date));

        form.find('[name=task-body]').val('');
        form.toggleClass('hidden');
    },

    renderTaskForm: function(){
        var formBlock = $('<div></div>');
        formBlock.addClass('task-form');
        formBlock.addClass('hidden');
        formBlock.attr('id', 'add-task-form')

        var title = $('<input>');
        title.addClass('form-task-title');
        title.attr('name', 'task-title');
        title.attr('type', 'text');

        var dueDate = $('<input>');
        dueDate.addClass('form-task-due-date');
        dueDate.attr('name', 'task-due-date');
        dueDate.attr('type', 'text');
        dueDate.datepicker({
            inline: true,
            dateFormat: 'mm.dd.yy'
        });
        dueDate.val(tm.Util.getNormalDate(new Date));

        var body = $('<textarea></textarea>');
        body.addClass('form-task-body');
        body.attr('name' ,'task-body');

        var selectTags = '<select name=task-tags">' +
            '<option selected>Important</option>' +
            '<option>In-progress</option>' +
            '<option>Finished</option>' +
            '<option>Not-started</option>' +
            '</select>';

        var tags = $(selectTags);
        tags.addClass('form-task-tags');
        tags.attr('name', 'task-tags');
        tags.attr('type', 'text');

        var saveBtn = $("<div>save</div>");
        saveBtn.addClass("form-save-new-task-button");

        var cancelBtn = $("<div>cancel</div>");
        cancelBtn.addClass("form-cancel-new-task-button");

        formBlock.append($('<div class="form-new-task-title row"><div class="form-label">Title</div></div>').append(title));
        formBlock.append($('<div class="form-new-task-due-date row"><div class="form-label">Due date</div></div>').append(dueDate));
        formBlock.append($('<div class="form-new-task-body row"><div class="form-label">Task</div></div>').append(body));
        formBlock.append($('<div class="form-new-task-tags row"><div class="form-label">Tags</div></div>').append(tags));
        formBlock.append($($('<div class="form-new-task-buttons row"></div>').append(saveBtn)).append(cancelBtn));

        return formBlock;
    },

    renderTagSelect: function(currentTag){
        var tagSelDOMel = $('<select></select>');
        tagSelDOMel.addClass('form-task-tags');
        tagSelDOMel.attr('name','task-tags');
        var option = '';
        $.each(tm.Util.tagsData, function(key, value){
            option = $('<option></option>');
            option.html(value.name);
            if (value.name == currentTag){
                option.attr('selected', true);
            }
            tagSelDOMel.append(option);
        });
        return tagSelDOMel;
    },

    setEditTaskMode: function (taskDOMElement) {
        $.each($('.editing'), function(key, value){
            tm.Util.cancelTaskEdit($(value));
        });

        var task = taskDOMElement;
        task.addClass('editing');
        task.siblings().addClass('editing-another-task-mode');

        var taskTitle = task.find('.task-title .title-text');
        taskTitle.addClass('hidden');
        var taskBody = task.find('.task-body');
        var taskTags = task.find('.task-tags');
        taskTags.addClass('hidden');
        var taskDueDate = task.find('.task-title .due-date');
        taskDueDate.addClass('hidden');

        var tagSelect = tm.Util.renderTagSelect(taskTags.html());

        taskBody.html(
                '<div class="task-form">' +
                    '<div class="row">' +
                        '<div class="form-label">Title</div>' +
                        '<input type="text" value="' + taskTitle.html() + '" name="task-title" class="form-task-title">' +
                    '</div>' +

                    '<div class="row">' +
                        '<div class="form-label">Due date</div>' +
                        '<input type="text" value="' + taskDueDate.html() + '" name="task-due-date" class="form-task-due-date">' +
                    '</div>' +

                    '<div class="row">' +
                        '<textarea name="task-body" class="form-task-body">' +
                        taskBody.html() +
                        '</textarea>' +
                    '</div>' +

                    '<div class="row tagSelect">' +
                        '<div class="form-label">Tag</div>' +

                    '</div>' +
                '</div>'
        );

        $('.task-form').find('.tagSelect').find('.form-label').after(tagSelect);

        task.find('.edit-task-button').addClass('hidden');
        task.find('.save-task-button').removeClass('hidden');
        task.find('.cancel-task-button').removeClass('hidden');
        task.find('.delete-task-button').removeClass('hidden');

        $('.task-form').find( "[name=task-due-date]" ).datepicker({
            inline: true,
            dateFormat: 'mm.dd.yy'
        });
    },

    saveTaskEdit: function (taskDOMElement) {
        var task = taskDOMElement;
        task.removeClass('editing');

        var taskTitle = task.find('[name="task-title"]')[0].value;
        var taskBody = task.find('[name="task-body"]')[0].value;
        var taskLink = task.find('.task-title').attr('link');
        var taskDueDate = task.find('[name=task-due-date]')[0].value;
        var taskTags = task.find('[name=task-tags]')[0].value.split(',');

        var taskObject = tm.curTasksObject.newTaskObject(
            task.attr('id'),
            taskTitle,
            taskDueDate,
            taskTags,
            taskBody,
            taskLink
        );

        tm.curTasksObject.updateTask(taskObject);
        tm.Util.unsetTaskEditMode(taskDOMElement);
        tm.Util.rebuildPage();
    },

    cancelTaskEdit: function (taskDOMElement) {
        tm.Util.unsetTaskEditMode(taskDOMElement);
    },

    unsetTaskEditMode: function (taskDOMElement) {

        taskDOMElement.removeClass('editing');
        taskDOMElement.siblings().removeClass('editing-another-task-mode');
        var taskId = taskDOMElement.attr('id');
        var taskObj = tm.curTasksObject.getTaskObjById(taskId);
        var taskDOMel = tm.Util.renderOneTaskDOMElement(taskObj);

        taskDOMElement.find('.edit-task-button').removeClass('hidden');
        taskDOMElement.find('.save-task-button').addClass('hidden');
        taskDOMElement.find('.cancel-task-button').addClass('hidden');
        taskDOMElement.find('.delete-task-button').addClass('hidden');

        taskDOMElement.find('.task-title .title-text').replaceWith($(taskDOMel).find('.task-title .title-text')).removeClass('row');
        taskDOMElement.find('.task-body').replaceWith($(taskDOMel).find('.task-body')).removeClass('row');
        taskDOMElement.find('.task-tags').replaceWith($(taskDOMel).find('.task-tags')).removeClass('row');
        taskDOMElement.find('.task-title .due-date').replaceWith($(taskDOMel).find('.task-title .due-date')).removeClass('row');
    },

    updateTasksDOM: function () {
        
    },

    Map: {
        renderMapDOMElement: function () {
            var taskMapDOMel = $('#task-map');
            taskMapDOMel.removeClass('hidden');
            tm.Util.Map.showCoordinates();
        },

        showCoordinates: function() {

            var mapOptions = {
                center: new google.maps.LatLng(50, 30),
                zoom: 5,
                mapTypeId: google.maps.MapTypeId.ROADMAP
            };

            var map = new google.maps.Map(document.getElementById("task-map"), mapOptions);

            $.each(tm.curTasksObject.get(), function (key, value) {
                if (value.position) {
                    var position = new google.maps.LatLng(value.position.lat, value.position.long);
                    var marker = new google.maps.Marker({ position: position, map: map, taskId: value.id });

                    google.maps.event.addListener(marker, "click", function (e) {
                        var infoWindow = new google.maps.InfoWindow({
                            content: '<a href="' + value.link + '">' + value.title + '</a>'
                        });
                        infoWindow.open(map, marker);

                    });
                }
            });
            
            }
    },

    renderModeSwitcher: function (){
        var switcher = $('#mode-switcher');

        //switcher.addClass('offline-mode');

        var offlineMode = $('<div></div>');
        offlineMode.addClass('offline');
        offlineMode.html('Offline');
        offlineMode.addClass('tag');

        var onlineMode = $('<div></div>');
        onlineMode.addClass('online');
        onlineMode.addClass('hidden');
        onlineMode.addClass('tag');
        onlineMode.html('Online');

        switcher.append(offlineMode);
        switcher.append(onlineMode);
    },

    isOfflineMode: function(){
        return $('#mode-switcher').hasClass('offline-mode');
    },

    renderOneTaskDOMElement: function (taskObject) {
        // template generation

        var taskElement = $("<div></div>");
        taskElement.addClass("task row");

        var taskTitle = $("<div></div>") ;
        taskTitle.addClass("task-title");

        var titleText = $('<span></span>');
        titleText.addClass("title-text");

        var dueDate = $("<span></span>") ;
        dueDate.addClass("due-date");

        var taskBody = $("<div></div>");
        taskBody.addClass("task-body");

        var taskFullText = $("<div></div>");
        taskFullText.addClass("task-fulltext");

        var editBtn = $("<div></div>");
        editBtn.addClass("edit-task-button");
        editBtn.attr("taskId", taskObject.id);

        var saveBtn = $("<div></div>");
        saveBtn.addClass("save-task-button");
        saveBtn.addClass("hidden");
        saveBtn.attr("taskId", taskObject.id);

        var cancelBtn = $("<div></div>");
        cancelBtn.addClass("cancel-task-button");
        cancelBtn.addClass("hidden");
        cancelBtn.attr("taskId", taskObject.id);

        var delBtn = $("<div></div>");
        delBtn.addClass("delete-task-button");
        delBtn.addClass("hidden");
        delBtn.attr("taskId", taskObject.id);

        var editTaskBlock = $("<div></div>");
        editTaskBlock.addClass("edit-task-block");

        // fill elements with data

        var taskLink = taskObject.link;

        var taskTags = $("<div></div>");
        taskTags.addClass("task-tags");
        taskTags.html(taskObject.tags + '');

        taskElement.attr("tags", taskObject.tags + '');

        taskElement.attr("id", taskObject.id);

        taskTitle.attr("link", taskLink);

        titleText.html(taskObject.title);
        taskTitle.html(titleText);
        dueDate.html(taskObject.dueDate);

        editBtn.html("edit");
        saveBtn.html("save");
        cancelBtn.html("cancel");
        delBtn.html("delete");

        taskBody.html(taskObject.taskBody);
        taskFullText.html(taskObject.taskFullText);

        // construct structure of task element

        taskTitle.append(dueDate);
        editTaskBlock.append(editBtn);
        editTaskBlock.append(saveBtn);
        editTaskBlock.append(cancelBtn);
        editTaskBlock.append(delBtn);

        taskElement.append(taskTitle);
        taskElement.append(taskBody);
        taskBody.after(taskTags);
        taskTags.after(editTaskBlock);

        return taskElement;
    },

    renderTasksDOMElement: function (tasksObj) {
        var tasks = tasksObj.get();

        this.clearTasksInDOM();

        $.each(tasks, function(key, value){
            tm.Util.allTasksDOMElement().append(tm.Util.renderOneTaskDOMElement(value));
        });
    },

    getNormalDate: function(date){
        var month = date.getMonth() + 1;
        if (month < 10) {
            month = '0' + month;
        }

        var day = date.getDate();
        if (day < 10) {
            day = '0' + day;
        }
        var fullyear = date.getFullYear();

        return month + '.' + day + '.' + fullyear;
    },

    getNormalDateTime: function(date){
        var hours = date.getHours();
        if (hours < 10) {
            hours = '0' + hours;
        }
        var minutes = date.getMinutes();
        if (minutes < 10) {
            minutes = '0' + minutes;
        }
        var seconds = date.getSeconds();
        if (seconds < 10) {
            seconds = '0' + seconds;
        }

        return (tm.Util.getNormalDate(date) + ' ' + hours + ':' + minutes + ':' + seconds);
    },

    generateUID: function() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
            return v.toString(16);
        });
    },

    activateURL: function (filterObject, curURLObject) {
        var urlFilter = curURLObject.get();
        var filterDates = {dueDate:'', startDate:''};

        if (urlFilter.tags.length > 0) {
            filterObject.setTagsFilter(urlFilter.tags);
        } else {
            filterObject.setTagsFilter('');
        }

        if (urlFilter.dates.dueDate.length > 0) {
            filterDates.dueDate = urlFilter.dates.dueDate;
        } else {filterDates.dueDate = '01.01.9999';}

        if (urlFilter.dates.startDate.length > 0) {
            filterDates.startDate = urlFilter.dates.startDate;
        } else {filterDates.startDate = '01.01.0001';}

        filterObject.setDatesFilter(filterDates);
    },

    subscribeToEvents: function(){
    $('.edit-task-button').on('click', function(e){
        tm.Util.editBtnClick($(this));
    });
    $('.cancel-task-button').on('click', function(e){
        tm.Util.cancelBtnClick($(this));
    });
    $('.save-task-button').on('click', function(e){
        tm.Util.saveBtnClick($(this));
    });
    $('.delete-task-button').on('click', function(e){
        tm.Util.delBtnClick($(this));
    });
}

}

tm.TagsMenu = function(curURLObject) {
    var tagsDOMel = $('#tags');
    var tagDOMel = '';
    var tags = '';
    var curURL = curURLObject.get();

    var init = function () {
        tags = getTags();
        renderTags(tags);
        tagDOMel = $('#tags .tag');
        clickTagSubscribe();
    };

    var getTags = function(){
        //stub
        var tagsData = tm.Util.tagsData;
        return tagsData;
    }

    var renderOneTagDOMel = function(tagData){
        var tagEl = $('<div>');
        tagEl.addClass('tag');
        tagEl.attr('tags', tagData.name);

        var tagtitle = $('<span>');
        tagtitle.addClass('tag-name');
        tagtitle.html(tagData.name);

        var tagcounter = $('<span>');
        tagcounter.addClass('tag-counter');

        tagEl.append(tagtitle);
        tagEl.append(tagcounter);

        if ($.inArray(tagData.name, curURL.tags) >= 0) {
            tagEl.addClass('tag-selected');
        }

        return tagEl;
    }

    var renderTags = function (tags) {
        tagsDOMel.empty();
        $.each(tags, function(key, value){
            tagsDOMel.append(renderOneTagDOMel(value));
        });
    };

    var clickTag = function(tag){
        var tags = tag.attr('tags');
        if (tag.hasClass('tag-selected')) {
            tag.removeClass('tag-selected');
            curURLObject.set('tags', '');
        } else {
            tag.siblings().removeClass('tag-selected');
            tag.addClass('tag-selected');
            curURLObject.set('tags', tags.split(','));
        }
    };

    var clickTagSubscribe = function(){
        tagDOMel.on('click', function(e){
            e.stopPropagation();
            clickTag($(this));
        });
    }

    init();
}

tm.DatesMenu = function(curURLObject) {
    var datesDOMel = $('#dates');
    var datesTodayDOMel = $('#dates-today');
    var datesThisWeekDOMel = $('#dates-this-week');
    var datesNextWeekDOMel = $('#dates-next-week');
    var datesLastWeekDOMel = $('#dates-last-week');

    var dateTagDOMel = $('#dates .tag');

    var init = function(){
        var today = Date.today();
        var thisWeekEnd = "";
        var thisWeekStart = "";
        var nextWeekEnd = "";
        var nextWeekStart = "";
        var lastWeekEnd = "";
        var lastWeekStart = "";

        if (Date.CultureInfo.firstDayOfWeek == 0) {
            if (today.is().sun()) {
                thisWeekStart = Date.today();
            } else {
                thisWeekStart = Date.today().prev().sun();
            }
        } else {
            if (today.is().mon()) {
                thisWeekStart = Date.today();
            } else {
                thisWeekStart = Date.today().prev().mon();
            }
        }

        thisWeekEnd = thisWeekStart.toDateString();
        thisWeekEnd = Date.parse(thisWeekEnd).addDays(6);

        nextWeekEnd = thisWeekEnd.toDateString();
        nextWeekEnd = Date.parse(nextWeekEnd).addDays(7);

        nextWeekStart = thisWeekStart.toDateString();
        nextWeekStart = Date.parse(nextWeekStart).addDays(7);

        lastWeekEnd = thisWeekEnd.toDateString();
        lastWeekEnd = Date.parse(lastWeekEnd).addDays(-7);

        lastWeekStart = thisWeekStart.toDateString();
        lastWeekStart = Date.parse(lastWeekStart).addDays(-7);

        datesTodayDOMel.attr('dueDate', tm.Util.getNormalDate(today));
        datesTodayDOMel.attr('startDate', tm.Util.getNormalDate(today));
        datesThisWeekDOMel.attr('dueDate', tm.Util.getNormalDate(thisWeekEnd));
        datesThisWeekDOMel.attr('startDate', tm.Util.getNormalDate(thisWeekStart));
        datesNextWeekDOMel.attr('dueDate', tm.Util.getNormalDate(nextWeekEnd));
        datesNextWeekDOMel.attr('startDate', tm.Util.getNormalDate(nextWeekStart));
        datesLastWeekDOMel.attr('dueDate', tm.Util.getNormalDate(lastWeekEnd));
        datesLastWeekDOMel.attr('startDate', tm.Util.getNormalDate(lastWeekStart));

        dateTagDOMel = $('#dates .tag');
        clickDateTagSubscribe();
    };

    var clickDateTag = function(dateTag) {
        if (dateTag.hasClass('tag-selected')){
            dateTag.removeClass('tag-selected');
            curURLObject.set('dates', {dueDate: '', startDate: ''});
            //window.taskFilter.setDates({dueDate: '01.01.9999', startDate: '01.01.0001'});
        } else {
            var startDate = dateTag.attr('startDate');
            var dueDate = dateTag.attr('dueDate');
            dateTag.siblings().removeClass('tag-selected');
            dateTag.addClass('tag-selected');
            curURLObject.set('dates', {dueDate: dueDate, startDate: startDate});
        }
    };

    var clickDateTagSubscribe = function() {
        dateTagDOMel.on('click', function(e){
            e.stopPropagation();
            clickDateTag($(this));
        });
    };

    init();
}

tm.TasksURL = function() {
    var currentUrl = {
        tags: [],
        dates: {dueDate:'', startDate:''}
    };

    this.set = function(type, value) {
        if (type == "tags"){
            currentUrl.tags = value;
        } else if(type == "dates") {
            currentUrl.dates = value;
        }

        var url = '';
        var urlArray = [];

        if (currentUrl.tags.length > 0) {
            urlArray.push('tags');
            urlArray.push(currentUrl.tags);
        }
        if (currentUrl.dates.dueDate.length > 0){
            urlArray.push('dueDate');
            urlArray.push(currentUrl.dates.dueDate);
        }
        if (currentUrl.dates.startDate.length > 0){
            urlArray.push('startDate');
            urlArray.push(currentUrl.dates.startDate);
        }

        url = '#/' + urlArray.join('/');
        location.href = url;
    };

    this.get = function(){
        var route = location.hash;
        var segments = route.split("/");
        var curURL = {
            tags: [],
            dates: {dueDate:'', startDate:''}
        };

        if(segments[0] == "#")
        {
            segments.splice(0,1);
        }

        $.each(segments, function(key, value){
            if (value == "tags") {
                curURL.tags.push(segments[key + 1]);
            }
            if (value == "dueDate") {
                curURL.dates.dueDate = segments[key + 1];
            }
            if (value == "startDate") {
                curURL.dates.startDate = segments[key + 1];
            }
        });
        return curURL;
    }
}

tm.TasksFilter = function() {
    var filter = {
        tags: [],
        startDate: '01.01.0001',
        dueDate: '01.01.9999',
        applyDatesFilter: true,
        applyTagsFilter: false
    };

    this.setTagsFilter = function (tags) {
        if (tags.length == 0) {
            filter.applyTagsFilter = false;
        } else {
            filter.applyTagsFilter = true;
            filter.tags = tags;
        }
    };

    this.setDatesFilter = function (dates) {
        filter.dueDate = dates.dueDate;
        filter.startDate = dates.startDate;
    };

    this.getCurrentFilter = function () {
        return filter;
    };
}

tm.DataSource = function(realSource){
    var src = realSource;

    this.getData = function(){
        return src.getData();
    };

    this.saveData = function(data) {
        src.saveData(data);
    }
}

tm.Tasks = function(tasksFilterObject, localStorageName, offlineMode) {
    var tasksData = [];
    var tasksFilter = tasksFilterObject.getCurrentFilter();
    var localStorage = localStorageName;

    this.loadTasks = function() {
        if (store.get('tm.tasks.update')){
            tm.lastLocalDate = Date.parse(store.get('tm.tasks.update'));
        }
        if (offlineMode == false) {
            this.getTasksUpdateDate();
            var localToRemoteCompare = tm.lastLocalDate.compareTo(tm.lastRemoteDate);
            if (localToRemoteCompare > 0) {
                tasksData = this.getTasksFromLocalStorage();
                this.saveTasks();
            } else if (localToRemoteCompare < 0){
                tasksData = this.getTasksFromWS();
                this.saveTasks();
            } else tasksData = this.getTasksFromLocalStorage();

        } else tasksData = this.getTasksFromLocalStorage();
    };

    this.saveTasks = function(){
        var date = tm.Util.getNormalDateTime(new Date);
        date = date + '';
        this.saveTasksToLocalStorage();
        if (offlineMode == false){
            this.saveAllTasksToWS(date);
        }

        store.set('tm.tasks.update', date);
    };

    this.setOfflineMode = function(mode){
        offlineMode = mode;
    };

    this.getOfflineMode = function(){
        return offlineMode;
    };

    this.getTaskObjById = function(taskId){
        var obj = {};

        $.each(tasksData, function(key, data){
            if (data.id == taskId){
                obj = data;
            }
        });
        return obj;
    };

    this.newTaskObject = function(
        id, title, dueDate, tags, body, link
        ){
        var taskObject = {
            id: id,
            title: title,
            dueDate: dueDate,
            tags: tags,
            taskBody: body,
            link: link
        };

        return taskObject;
    };

    this.applyTasksFilter = function () {
        var result = [];
        if (tasksFilter.applyDatesFilter) {

            var startDate = Date.parse(tasksFilter.startDate);
            var dueDate = Date.parse(tasksFilter.dueDate);
            var tempDueDate = '';
            $.each(tasksData, function(key, value){
                tempDueDate = Date.parse(value.dueDate);
                if (tempDueDate.between(startDate, dueDate) == true) {

                    if (tasksFilter.applyTagsFilter) {

                        if ($.inArray(tasksFilter.tags[0], value.tags) >= 0) {
                            result.push(value);
                        }
                    } else result.push(value);

                }
            });
        } else result = tasksData;

        return result;
    };

    this.get = function () {
        return this.applyTasksFilter();
    };

    this.addTask = function (taskObject) {
        tasksData.push(taskObject);
        this.saveTasks();
    };

    this.deleteTask = function (taskObjectId) {
        $.each(tasksData, function(key, value){
            if (value.id == taskObjectId) {
                tasksData.splice(key, 1);
                return false;
            }
        });
        this.saveTasks();
    };

    this.updateTask = function (taskObject) {
        $.each(tasksData, function(key, value){
            if (value.id == taskObject.id) {
                tasksData[key] = taskObject;
                return false;
            }
        });
        this.saveTasks();
    };

    this.saveTasksToLocalStorage = function () {
        store.set(localStorage, tasksData);
    };

    this.removeTasksFromLocalStorage = function() {
        store.remove(localStorage);
    };

    this.getTasksFromLocalStorage = function(){
        return store.get(localStorage);
    };

    this.saveAllTasksToWS = function(date) {

        $.ajax({
            type: "GET",
            url: "/delete/tasks",
            dataType: "json",
            success: function(){
                var data = tasksData;
                $.each(data, function (key, value){
                    $.ajax({
                        type: "POST",
                        url: "/tasks",
                        data: value,
                        dataType: "json"
                    });
                });

            }
        });
        this.saveTasksUpdateDate(date);
    };

    this.addOneTaskToWS = function(taskObject) {
            $.ajax({
                type: "POST",
                url: "/tasks",
                data: taskObject,
                dataType: "json"
            });
    };

    this.saveTasksUpdateDate = function(date){
        $.ajax({
            type: "POST",
            url: "/updateTasksDate",
            data: {date: date + ''},
            dataType: "json"
        });
    };

    this.getTasksUpdateDate = function(date){
        $.ajax({
            type: "GET",
            url: "/updateTasksDate",
            data: date,
            dataType: "json",
            success: function(data){
                tm.lastRemoteDate = Date.parse(data.date);
            }
        });

    };

    this.updateOneTaskToWS = function(taskObject){
        $.ajax({
            type: "PUT",
            url: "/tasks",
            data: taskObject,
            dataType: "json"
        });
    };

    this.removeAllTasksFromWS = function() {
        $.ajax({
            type: "GET",
            url: "/delete/tasks",
            dataType: "json"
        });
    };

    this.getTasksFromWS = function() {

        $.ajax({
            type: "GET",
            url: "/tasks",
            dataType: "json",
            success: function(data){
                console.log(data);
            }
        });
        return tasks.responseJSON;
    };
}
