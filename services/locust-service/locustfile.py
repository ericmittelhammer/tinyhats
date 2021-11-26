import random
from locust import HttpUser, TaskSet, between

# generate this with:
# awk 'BEGIN {ORS=" "; print "[" } /.*INSERT INTO/ { print $9 } END { print "]"}' ../../kube/mysql-deployment.yaml

hats = [ 'bucket', 'spinner', 'skull', 'Santa', 'graduation', 'pirate', 'pokemon', 'clown', 'Spy', 'Mario', 'tophat', 'construction', 'Beach', 'turkey', 'Shark', 'Alien', 'tinyhat', 'cat-ears' ]

def index(l):
    l.client.get("/")

def listHats(l):
    l.client.get("/list")

def browseProduct(l):
    l.client.get("/hatme?style=" + random.choice(hats))

class UserBehavior(TaskSet):

    def on_start(self):
        index(self)

    tasks = {index: 1,
        listHats: 4,
        browseProduct: 20,
    }

class WebsiteUser(HttpUser):
    tasks = [UserBehavior]
    wait_time = between(1, 2)