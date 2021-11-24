import random
from locust import HttpUser, TaskSet, between

# generate this with:
# awk 'BEGIN {ORS=" "; print "[" } /.*INSERT INTO/ { print $9 } END { print "]"}' ../../kube/mysql-deployment.yaml

hats = [ 'baby', 'bucket', 'Beach', 'spinner', 'cartoon', 'skull', 'Blob', 'santa', 'St-Patricks', 'santa', 'graduation', 'blob', 'pirate', 'pokemon', 'clown', 'Spy', 'st-patricks', 'Mario', 'tophat', 'pilot', 'tophat', 'construction', 'Beach', 'turkey', 'st-patricks', 'Shark', 'Alien', 'penguin', 'tinyhat', 'cat-ears', 'spicy', 'food' ]

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