# Licensed under the Apache License, Version 2.0 (the "License"); you may
# not use this file except in compliance with the License. You may obtain
# a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
# WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
# License for the specific language governing permissions and limitations
# under the License.

import json
import math
import re

import six

from django.conf import settings
from django.contrib.auth import logout  # noqa
from django.contrib.messages.storage import cookie
from django.core import urlresolvers
from django import http
from django.utils.encoding import force_text
from django.utils import functional  # noqa
from django.utils.functional import lazy  # noqa
from django.utils import html
from django.utils import translation

from horizon import base


class JSONSafeEncoder(json.JSONEncoder):
    """Safe encode an object into JSON, using django escape and mark the result
    as safe in order to avoid template escaping.
    """
    def __init__(self, *args, **kwargs):
        super(JSONSafeEncoder, self).__init__(*args, **kwargs)
        self.flag = True

    def default(self, o):
        """Override this method to encode specific object
        """
        if isinstance(o, cookie.CookieStorage):
            return [
                {
                    "type": html.escape(message.tags),
                    "msg": html.escape(message)
                } for message in o]
        if isinstance(o, base.Panel):
            try:
                url = o.get_absolute_url()
            except urlresolvers.NoReverseMatch:
                url = "#"
            return {
                "name": o.name,
                "url": url
            }
        if isinstance(o, functional.Promise):
            return unicode(o)

        return json.JSONEncoder.default(self, o)

    def _encode(self, o):
        if isinstance(o, basestring):
            return html.escape(o)
        else:
            return self.encode(o)

    def encode(self, o):
        """Overrides encode in order to escape every string in types handled by
        default.
        """
        flag = self.flag
        self.flag = False
        if isinstance(o, basestring):
            o = html.escape(o)
        if isinstance(o, (list, tuple)):
            o = [self._encode(obj) for obj in o]
        if isinstance(o, dict):
            o = dict([(key, self._encode(value))
                      for key, value in six.iteritems(o)])

        return html.mark_safe(json.JSONEncoder.encode(self, o)) if flag else o


def _lazy_join(separator, strings):
    return separator.join([force_text(s)
                           for s in strings])

lazy_join = lazy(_lazy_join, unicode)


def bytes_to_gigabytes(bytes):
    # Converts the number of bytes to the next highest number of Gigabytes
    # For example 5000000 (5 Meg) would return '1'
    return int(math.ceil(float(bytes) / 1024 ** 3))


def add_logout_reason(request, response, reason):
    # Store the translated string in the cookie
    lang = translation.get_language_from_request(request)
    with translation.override(lang):
        reason = unicode(reason).encode('utf-8')
        response.set_cookie('logout_reason', reason, max_age=30)


def logout_with_message(request, msg):
    """Send HttpResponseRedirect to LOGOUT_URL.

    `msg` is a message displayed on the login page after the logout, to explain
    the logout reason.
    """
    logout(request)
    response = http.HttpResponseRedirect(
        '%s?next=%s' % (settings.LOGOUT_URL, request.path))
    add_logout_reason(request, response, msg)
    return response


def get_page_size(request, default=20):
    session = request.session
    cookies = request.COOKIES
    try:
        page_size = int(session.get('horizon_pagesize',
                                    cookies.get('horizon_pagesize',
                                                getattr(settings,
                                                        'API_RESULT_PAGE_SIZE',
                                                        default))))
    except ValueError:
        page_size = session['horizon_pagesize'] = int(default)
    return page_size


def natural_sort(attr):
    return lambda x: [int(s) if s.isdigit() else s for s in
                      re.split(r'(\d+)', getattr(x, attr, x))]
